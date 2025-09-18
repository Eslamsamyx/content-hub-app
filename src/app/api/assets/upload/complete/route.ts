import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { objectExists } from '@/lib/s3-enhanced'
import { getAssetTypeFromMime, getFileExtension } from '@/lib/file-utils'
import { prisma } from '@/lib/prisma'
import { UploadStatus, ProcessingStatus, Visibility, UsageType } from '@prisma/client'

interface UploadCompleteRequest {
  uploadId: string
  fileKey: string
  metadata: {
    title: string
    description?: string
    category: string
    tags?: string[]
    eventName?: string
    company?: string
    project?: string
    campaign?: string
    productionYear?: number
    usage?: 'internal' | 'public'
    readyForPublishing?: boolean
  }
  fileSize: number
  mimeType: string
  originalFilename: string
  width?: number
  height?: number
  duration?: number
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'asset.create')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body: UploadCompleteRequest = await request.json()
    const { 
      uploadId, 
      fileKey, 
      metadata, 
      fileSize, 
      mimeType, 
      originalFilename,
      width,
      height,
      duration
    } = body

    // Validate required fields
    if (!uploadId || !fileKey || !metadata?.title || !metadata?.category || !fileSize || !mimeType || !originalFilename) {
      return ApiErrors.VALIDATION_ERROR('Missing required fields')
    }

    // Verify file exists in S3
    const fileExists = await objectExists(fileKey)
    if (!fileExists) {
      return ApiErrors.VALIDATION_ERROR('File not found in storage')
    }

    // Get asset type from mime type
    const assetType = getAssetTypeFromMime(mimeType)
    if (!assetType) {
      return ApiErrors.VALIDATION_ERROR('Invalid file type')
    }

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
      // Create asset record
      const asset = await tx.asset.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          filename: fileKey.split('/').pop()!,
          originalFilename,
          fileKey,
          fileSize: BigInt(fileSize),
          mimeType,
          format: getFileExtension(originalFilename),
          type: assetType,
          category: metadata.category,
          eventName: metadata.eventName,
          company: metadata.company,
          project: metadata.project,
          campaign: metadata.campaign,
          productionYear: metadata.productionYear,
          width,
          height,
          duration,
          visibility: Visibility.INTERNAL,
          usage: metadata.usage === 'public' ? UsageType.PUBLIC : UsageType.INTERNAL,
          readyForPublishing: metadata.readyForPublishing || false,
          uploadStatus: UploadStatus.COMPLETED,
          processingStatus: ProcessingStatus.PENDING,
          uploadedById: user!.id,
          batchId: uploadId, // Use uploadId as batch ID for potential batch uploads
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
      if (metadata.tags && metadata.tags.length > 0) {
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
            addedBy: user!.id,
          })),
        })
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'ASSET_UPLOADED',
          description: `Uploaded ${metadata.title}`,
          userId: user!.id,
          assetId: asset.id,
          metadata: {
            fileSize,
            mimeType,
            originalFilename,
          },
        },
      })

      return asset
    })

    const asset = result

    // Queue processing job based on asset type
    const { addAssetProcessingJob, JobType } = await import('@/lib/queue')
    
    switch (assetType) {
      case 'IMAGE':
        await addAssetProcessingJob(JobType.PROCESS_IMAGE, {
          assetId: asset.id,
          fileKey,
          mimeType,
        })
        break
      case 'VIDEO':
        await addAssetProcessingJob(JobType.PROCESS_VIDEO, {
          assetId: asset.id,
          fileKey,
          mimeType,
        })
        break
      case 'DOCUMENT':
        await addAssetProcessingJob(JobType.PROCESS_DOCUMENT, {
          assetId: asset.id,
          fileKey,
          mimeType,
        })
        break
      case 'AUDIO':
        await addAssetProcessingJob(JobType.PROCESS_AUDIO, {
          assetId: asset.id,
          fileKey,
          mimeType,
        })
        break
      // 3D models and design files may need special handling
      default:
        // Mark as completed if no processing needed
        await prisma.asset.update({
          where: { id: asset.id },
          data: { processingStatus: ProcessingStatus.COMPLETED },
        })
    }

    return successResponse({
      asset: {
        ...asset,
        fileSize: asset.fileSize.toString(), // Convert BigInt for JSON
      },
    }, undefined, 201)
  } catch (error) {
    console.error('Upload complete error:', error)
    return ApiErrors.SERVER_ERROR('Failed to complete upload')
  }
}