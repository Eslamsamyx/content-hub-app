import sharp from 'sharp'
import { Worker, Job } from 'bullmq'
import redis from '@/lib/redis'
import { prisma } from '@/lib/prisma'
import { uploadToS3, generateVariantKeys, getDownloadUrl } from '@/lib/s3-enhanced'
import { JobType } from '@/lib/queue'
import { VariantType, ProcessingStatus } from '@prisma/client'

interface ImageProcessingData {
  assetId: string
  fileKey: string
  mimeType: string
}

// Image variant configurations (matching UI aspect-video 16:9)
const VARIANT_CONFIGS = {
  [VariantType.THUMBNAIL]: {
    width: 400,
    height: 225,  // 16:9 aspect ratio for cards
    fit: 'cover' as const,
    quality: 80,
  },
  [VariantType.PREVIEW]: {
    width: 1200,
    height: 675,  // 16:9 aspect ratio
    fit: 'inside' as const,
    quality: 85,
  },
  [VariantType.WEB_OPTIMIZED]: {
    width: 1920,
    height: 1080,  // 16:9 aspect ratio
    fit: 'inside' as const,
    quality: 85,
    format: 'webp' as const,
  },
  [VariantType.MOBILE]: {
    width: 800,
    height: 450,  // 16:9 aspect ratio for mobile
    fit: 'cover' as const,
    quality: 80,
  },
}

async function processImage(job: Job<ImageProcessingData>) {
  const { assetId, fileKey, mimeType } = job.data
  
  try {
    // Update processing status
    await prisma.asset.update({
      where: { id: assetId },
      data: { processingStatus: ProcessingStatus.PROCESSING },
    })

    // Get the original image from S3
    const imageUrl = await getDownloadUrl(fileKey, undefined, 3600)
    const response = await fetch(imageUrl)
    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Process the image with Sharp
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Update asset with image dimensions
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        width: metadata.width,
        height: metadata.height,
      },
    })

    // Generate variant keys
    const variantKeys = generateVariantKeys(fileKey)

    // Process each variant
    const variants = await Promise.all(
      Object.entries(VARIANT_CONFIGS).map(async ([variantType, config]) => {
        const key = variantKeys[variantType.toLowerCase() as keyof typeof variantKeys]
        
        // Process image
        let processedImage = image.clone()
        
        if ('format' in config && config.format) {
          processedImage = processedImage.toFormat(config.format)
        }
        
        const processedBuffer = await processedImage
          .resize(config.width, config.height, { fit: config.fit })
          .jpeg({ quality: config.quality })
          .toBuffer()

        // Upload to S3
        await uploadToS3(
          key,
          processedBuffer,
          ('format' in config && config.format === 'webp') ? 'image/webp' : mimeType
        )

        // Get processed image info
        const processedMetadata = await sharp(processedBuffer).metadata()

        // Create variant record
        return await prisma.assetVariant.create({
          data: {
            assetId,
            variantType: variantType as VariantType,
            fileKey: key,
            width: processedMetadata.width,
            height: processedMetadata.height,
            fileSize: BigInt(processedBuffer.length),
            format: processedMetadata.format || 'unknown',
            quality: config.quality,
          },
        })
      })
    )

    // Update asset with variant keys and processing status
    await prisma.asset.update({
      where: { id: assetId },
      data: {
        thumbnailKey: variantKeys.thumbnail,
        previewKey: variantKeys.preview,
        processingStatus: ProcessingStatus.COMPLETED,
      },
    })

    // Extract and save metadata
    await prisma.assetMetadata.create({
      data: {
        assetId,
        colorSpace: metadata.space,
        dpi: metadata.density,
        bitDepth: typeof metadata.depth === 'number' ? metadata.depth : null,
        customFields: {
          format: metadata.format,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
          orientation: metadata.orientation,
        },
      },
    })

    return {
      success: true,
      variants: variants.length,
      metadata,
    }
  } catch (error) {
    console.error('Image processing error:', error)
    
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
export const imageProcessingWorker = new Worker(
  'asset-processing',
  async (job: Job) => {
    if (job.name === JobType.PROCESS_IMAGE) {
      return await processImage(job as Job<ImageProcessingData>)
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 images at once
  }
)

imageProcessingWorker.on('completed', (job) => {
  console.log(`Image processing completed for job ${job.id}`)
})

imageProcessingWorker.on('failed', (job, err) => {
  console.error(`Image processing failed for job ${job?.id}:`, err)
})