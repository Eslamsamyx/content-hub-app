import { Worker, Job } from 'bullmq'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import sharp from 'sharp'
import { promises as fs } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import redis from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { uploadToS3, generateVariantKeys, getDownloadUrl } from '@/lib/s3-enhanced'
import { JobType } from '@/lib/queue'
import { ProcessingStatus } from '@prisma/client'

// Set ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

/**
 * Parse frame rate from ffmpeg format (e.g., "30/1" -> 30, "24000/1001" -> 23.976)
 */
function parseFrameRate(frameRateStr: string): number {
  if (!frameRateStr) return 0
  
  // Handle simple numeric values
  if (!frameRateStr.includes('/')) {
    return parseFloat(frameRateStr)
  }
  
  // Handle fraction format
  const parts = frameRateStr.split('/')
  if (parts.length !== 2) return 0
  
  const numerator = parseFloat(parts[0])
  const denominator = parseFloat(parts[1])
  
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return 0
  }
  
  return numerator / denominator
}

interface VideoProcessingData {
  assetId: string
  fileKey: string
  mimeType: string
}

async function processVideo(job: Job<VideoProcessingData>) {
  const { assetId, fileKey } = job.data
  const tempDir = join(tmpdir(), `video-${assetId}`)
  
  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true })
    
    // Update processing status
    await prisma.asset.update({
      where: { id: assetId },
      data: { processingStatus: ProcessingStatus.PROCESSING },
    })

    // Get the video URL from S3
    const videoUrl = await getDownloadUrl(fileKey, undefined, 3600)
    
    // Generate variant keys
    const variantKeys = generateVariantKeys(fileKey)
    
    // Get video metadata
    const metadata = await new Promise<any>((resolve, reject) => {
      ffmpeg.ffprobe(videoUrl, (err, data) => {
        if (err) reject(err)
        else resolve(data)
      })
    })
    
    const videoStream = metadata.streams.find((s: any) => s.codec_type === 'video')
    const duration = Math.floor(parseFloat(metadata.format.duration || '0'))
    
    // Update asset with video dimensions and duration
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        width: videoStream?.width,
        height: videoStream?.height,
        duration,
      },
    })
    
    // Generate thumbnail at 10% of video duration
    const thumbnailTime = Math.floor(duration * 0.1)
    const thumbnailPath = join(tempDir, 'thumbnail.jpg')
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoUrl)
        .screenshots({
          timestamps: [thumbnailTime],
          filename: 'thumbnail.jpg',
          folder: tempDir,
          size: '640x360',
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
    })
    
    // Process thumbnail with Sharp for optimization
    const thumbnailBuffer = await sharp(thumbnailPath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    
    // Upload thumbnail
    await uploadToS3(variantKeys.thumbnail, thumbnailBuffer, 'image/jpeg')
    
    // Generate preview video (lower quality, max 30 seconds)
    const previewPath = join(tempDir, 'preview.mp4')
    const previewDuration = Math.min(duration, 30)
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(videoUrl)
        .setDuration(previewDuration)
        .videoCodec('libx264')
        .videoBitrate('1000k')
        .size('1280x720')
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions([
          '-preset fast',
          '-movflags +faststart', // Optimize for web streaming
        ])
        .save(previewPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .on('progress', (progress) => {
          // Update job progress
          job.updateProgress(progress.percent || 0)
        })
    })
    
    // Upload preview video
    const previewBuffer = await fs.readFile(previewPath)
    await uploadToS3(variantKeys.preview, previewBuffer, 'video/mp4')
    
    // Create variant records
    await prisma.assetVariant.createMany({
      data: [
        {
          assetId,
          variantType: 'THUMBNAIL',
          fileKey: variantKeys.thumbnail,
          width: 300,
          height: 300,
          fileSize: BigInt(thumbnailBuffer.length),
          format: 'jpeg',
        },
        {
          assetId,
          variantType: 'PREVIEW',
          fileKey: variantKeys.preview,
          width: 1280,
          height: 720,
          fileSize: BigInt(previewBuffer.length),
          format: 'mp4',
        },
      ],
    })
    
    // Update asset with variant keys and processing status
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        thumbnailKey: variantKeys.thumbnail,
        previewKey: variantKeys.preview,
        processingStatus: ProcessingStatus.COMPLETED,
      },
    })
    
    // Save video metadata
    await prisma.assetMetadata.create({
      data: {
        assetId,
        frameRate: videoStream?.r_frame_rate ? 
          parseFrameRate(videoStream.r_frame_rate) : undefined, // Convert "30/1" to 30
        bitRate: parseInt(videoStream?.bit_rate || '0'),
        codec: videoStream?.codec_name,
        customFields: {
          format: metadata.format.format_name,
          audioCodec: metadata.streams.find((s: any) => s.codec_type === 'audio')?.codec_name,
          resolution: `${videoStream?.width}x${videoStream?.height}`,
        },
      },
    })
    
    // Clean up temp files
    await fs.rm(tempDir, { recursive: true, force: true })
    
    return {
      success: true,
      metadata: {
        duration,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
      },
    }
  } catch (error) {
    console.error('Video processing error:', error)
    
    // Clean up temp files on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (cleanupError) {
      console.error('Failed to clean up temp files:', cleanupError)
    }
    
    // Update asset with error status
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        processingStatus: ProcessingStatus.FAILED,
        processingError: error instanceof Error ? error.message : 'Unknown error',
      },
    })
    
    throw error
  }
}

// Create the worker
export const videoProcessingWorker = new Worker(
  'asset-processing',
  async (job: Job) => {
    if (job.name === JobType.PROCESS_VIDEO) {
      return await processVideo(job as Job<VideoProcessingData>)
    }
  },
  {
    connection: redis,
    concurrency: 2, // Process up to 2 videos at once (video processing is resource intensive)
  }
)

videoProcessingWorker.on('completed', (job) => {
  console.log(`Video processing completed for job ${job.id}`)
})

videoProcessingWorker.on('failed', (job, err) => {
  console.error(`Video processing failed for job ${job?.id}:`, err)
})