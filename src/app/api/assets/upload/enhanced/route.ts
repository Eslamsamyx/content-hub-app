import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { s3Service, generateFileKey } from '@/lib/s3-enhanced'
import { prisma } from '@/lib/prisma'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { getAssetTypeFromMime, getFileExtension } from '@/lib/file-utils'
import { UploadStatus, ProcessingStatus, Visibility, UsageType } from '@prisma/client'
import { ThumbnailService } from '@/lib/thumbnail-service'

// Enhanced upload with full metadata support
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return ApiErrors.UNAUTHORIZED()
    }

    const user = session.user as any
    console.log('🔐 Enhanced upload - User authenticated:', { id: user.id, email: user.email })

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // Parse metadata from form
    const metadata = {
      title: formData.get('title') as string || file.name.split('.')[0],
      description: formData.get('description') as string || '',
      category: formData.get('category') as string || 'document',
      eventName: formData.get('eventName') as string || undefined,
      company: formData.get('company') as string || undefined,
      project: formData.get('project') as string || undefined,
      campaign: formData.get('campaign') as string || undefined,
      productionYear: formData.get('productionYear') ? parseInt(formData.get('productionYear') as string) : undefined,
      usage: (formData.get('usage') as string || 'internal') as 'internal' | 'public',
      readyForPublishing: formData.get('readyForPublishing') === 'true',
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean) : []
    }

    // Parse dimensions if provided
    const width = formData.get('width') ? parseInt(formData.get('width') as string) : undefined
    const height = formData.get('height') ? parseInt(formData.get('height') as string) : undefined
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined

    if (!file) {
      return ApiErrors.VALIDATION_ERROR('File is required')
    }

    console.log('📤 Enhanced upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      metadata: { ...metadata, tags: metadata.tags.length }
    })

    // Get asset type from mime type first
    const dbAssetType = getAssetTypeFromMime(file.type)
    if (!dbAssetType) {
      return ApiErrors.VALIDATION_ERROR('Invalid file type')
    }

    // Initialize S3 service
    await s3Service.initialize()

    // Generate file keys
    const assetType = file.type.split('/')[0]
    const fileKey = generateFileKey(file.name, assetType, user.id)
    const thumbnailKey = ThumbnailService.generateThumbnailKey(fileKey, 'thumbnail')
    const previewKey = ThumbnailService.generateThumbnailKey(fileKey, 'preview')

    console.log('🔑 Generated keys:', { fileKey, thumbnailKey })

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Generate thumbnails (with error handling)
    console.log('🖼️ Generating thumbnails...')
    let thumbnails
    try {
      thumbnails = await ThumbnailService.generateThumbnails(
        buffer,
        file.type,
        file.name
      )
    } catch (thumbnailError) {
      console.error('⚠️ Thumbnail generation failed:', thumbnailError)
      // Create a basic placeholder if thumbnail generation fails
      const placeholderSvg = `<svg width="300" height="300"><rect width="300" height="300" fill="#ccc"/></svg>`
      thumbnails = {
        thumbnail: Buffer.from(placeholderSvg),
        preview: null,
        metadata: {}
      }
    }

    // Upload all files to S3 in parallel
    const uploadPromises = [
      // Upload original file
      s3Service.uploadFile(
        fileKey,
        buffer,
        file.type,
        {
          'original-name': file.name,
          'uploaded-by': user.id,
          'upload-date': new Date().toISOString(),
          'title': metadata.title,
          'category': metadata.category
        }
      ),
      // Upload thumbnail
      s3Service.uploadFile(
        thumbnailKey,
        thumbnails.thumbnail,
        'image/jpeg',
        {
          'type': 'thumbnail',
          'original-asset': fileKey
        }
      )
    ]

    // Upload preview if it exists (for images)
    if (thumbnails.preview) {
      uploadPromises.push(
        s3Service.uploadFile(
          previewKey,
          thumbnails.preview,
          'image/jpeg',
          {
            'type': 'preview',
            'original-asset': fileKey
          }
        )
      )
    }

    await Promise.all(uploadPromises)
    console.log('✅ Files uploaded to S3')

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create asset record with full metadata
      const asset = await tx.asset.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          filename: fileKey.split('/').pop()!,
          originalFilename: file.name,
          fileKey,
          thumbnailKey,
          previewKey: thumbnails.preview ? previewKey : null,
          fileSize: BigInt(file.size),
          mimeType: file.type,
          format: getFileExtension(file.name),
          type: dbAssetType,
          category: metadata.category,
          eventName: metadata.eventName,
          company: metadata.company,
          project: metadata.project,
          campaign: metadata.campaign,
          productionYear: metadata.productionYear,
          width: thumbnails.metadata?.width || width,
          height: thumbnails.metadata?.height || height,
          duration,
          visibility: Visibility.INTERNAL,
          usage: metadata.usage === 'public' ? UsageType.PUBLIC : UsageType.INTERNAL,
          readyForPublishing: metadata.readyForPublishing,
          uploadStatus: UploadStatus.COMPLETED,
          processingStatus: ProcessingStatus.COMPLETED, // Thumbnails are done
          uploadedById: user.id,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      })

      // Create tags if provided
      if (metadata.tags.length > 0) {
        console.log('🏷️ Processing tags:', metadata.tags)
        
        // Get or create tags
        const tagRecords = await Promise.all(
          metadata.tags.map(async (tagName) => {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-')
            return await tx.tag.upsert({
              where: { slug },
              update: { usageCount: { increment: 1 } },
              create: {
                name: tagName,
                slug,
                category: 'CUSTOM',
                usageCount: 1
              },
            })
          })
        )

        // Create asset-tag relationships
        await tx.assetTag.createMany({
          data: tagRecords.map(tag => ({
            assetId: asset.id,
            tagId: tag.id,
            addedBy: user.id,
          })),
        })
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'ASSET_UPLOADED',
          description: `Uploaded ${metadata.title}`,
          userId: user.id,
          assetId: asset.id,
          metadata: {
            fileSize: file.size,
            mimeType: file.type,
            originalFilename: file.name,
          },
        },
      })

      return asset
    })

    console.log('💾 Enhanced asset saved to database:', result.id)

    // Queue processing job based on asset type
    try {
      const { addAssetProcessingJob, JobType } = await import('@/lib/queue')
      
      switch (dbAssetType) {
        case 'IMAGE':
          await addAssetProcessingJob(JobType.PROCESS_IMAGE, {
            assetId: result.id,
            fileKey,
            mimeType: file.type,
          })
          break
        case 'VIDEO':
          await addAssetProcessingJob(JobType.PROCESS_VIDEO, {
            assetId: result.id,
            fileKey,
            mimeType: file.type,
          })
          break
        case 'DOCUMENT':
          await addAssetProcessingJob(JobType.PROCESS_DOCUMENT, {
            assetId: result.id,
            fileKey,
            mimeType: file.type,
          })
          break
        case 'AUDIO':
          await addAssetProcessingJob(JobType.PROCESS_AUDIO, {
            assetId: result.id,
            fileKey,
            mimeType: file.type,
          })
          break
        default:
          console.log('📦 Asset type requires no additional processing')
      }
    } catch (error) {
      console.warn('⚠️ Queue system not available, but thumbnails already generated:', error)
    }

    // Generate S3 URLs for immediate verification
    const [directUrl, thumbnailUrl] = await Promise.all([
      s3Service.getDownloadUrl(result.fileKey, result.filename, 3600),
      s3Service.getDownloadUrl(result.thumbnailKey!, 'thumbnail.jpg', 3600)
    ])

    return successResponse({
      asset: {
        ...result,
        fileSize: result.fileSize.toString(), // Convert BigInt for JSON
        thumbnailUrl, // Include thumbnail URL
      },
      directUrl: directUrl, // Direct S3 link for immediate access
      thumbnailUrl: thumbnailUrl, // Thumbnail link for preview
      downloadUrl: `/api/assets/${result.id}/download`,
      viewUrl: `/api/assets/${result.id}`,
      message: 'Enhanced upload completed successfully with thumbnails'
    }, undefined, 201)

  } catch (error: any) {
    console.error('❌ Enhanced upload error:', error)
    return ApiErrors.SERVER_ERROR(`Enhanced upload failed: ${error.message}`)
  }
}