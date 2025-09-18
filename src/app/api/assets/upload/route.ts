import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { s3Service } from '@/lib/s3-enhanced'
import { getAssetTypeFromMime, getFileExtension } from '@/lib/file-utils'
import { prisma } from '@/lib/prisma'
import { UploadStatus, ProcessingStatus, Visibility, UsageType } from '@prisma/client'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'asset.create')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return ApiErrors.VALIDATION_ERROR('No file provided')
    }

    // Get metadata from form data
    const title = formData.get('title') as string || file.name.replace(/\.[^/.]+$/, '')
    const description = formData.get('description') as string || ''
    const category = formData.get('category') as string || 'General'
    const tags = formData.get('tags') ? (formData.get('tags') as string).split(',').filter(Boolean) : []
    const company = formData.get('company') as string || ''
    const eventName = formData.get('eventName') as string || ''
    const project = formData.get('project') as string || ''
    const campaign = formData.get('campaign') as string || ''
    const productionYear = formData.get('productionYear') ? parseInt(formData.get('productionYear') as string) : undefined
    const usage = formData.get('usage') as string || 'internal'
    const readyForPublishing = formData.get('readyForPublishing') === 'true'

    // Validate file
    const fileSize = file.size
    const mimeType = file.type || 'application/octet-stream'
    const assetType = getAssetTypeFromMime(mimeType)
    
    if (!assetType) {
      return ApiErrors.VALIDATION_ERROR('Unsupported file type')
    }

    // Generate S3 key
    const uploadId = nanoid()
    const fileExtension = getFileExtension(file.name)
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '/')
    const fileKey = `assets/${timestamp}/${uploadId}-${file.name}`

    // Upload to S3
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      await s3Service.uploadFile(fileKey, buffer, mimeType, {
        'uploaded-by': user!.email,
        'original-name': file.name,
        'upload-id': uploadId
      })
    } catch (uploadError: any) {
      console.error('S3 upload error:', uploadError)
      return ApiErrors.SERVER_ERROR(`Failed to upload file: ${uploadError.message}`)
    }

    // Create asset record in database
    const asset = await prisma.$transaction(async (tx) => {
      // Create asset
      const newAsset = await tx.asset.create({
        data: {
          title,
          description,
          filename: file.name,
          originalFilename: file.name,
          fileKey,
          fileSize: BigInt(fileSize),
          mimeType,
          format: fileExtension,
          type: assetType,
          category,
          eventName,
          company,
          project,
          campaign,
          productionYear,
          visibility: Visibility.INTERNAL,
          usage: usage === 'public' ? UsageType.PUBLIC : UsageType.INTERNAL,
          readyForPublishing,
          uploadStatus: UploadStatus.COMPLETED,
          processingStatus: ProcessingStatus.PENDING,
          uploadedById: user!.id,
          batchId: uploadId,
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
      if (tags.length > 0) {
        const tagRecords = await Promise.all(
          tags.map(async (tagName) => {
            const slug = tagName.toLowerCase().replace(/\s+/g, '-')
            return await tx.tag.upsert({
              where: { slug },
              update: { usageCount: { increment: 1 } },
              create: {
                name: tagName,
                slug,
                category: 'CUSTOM',
              },
            })
          })
        )

        await tx.assetTag.createMany({
          data: tagRecords.map(tag => ({
            assetId: newAsset.id,
            tagId: tag.id,
            addedBy: user!.id,
          })),
        })
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: 'ASSET_UPLOADED',
          description: `Uploaded ${title}`,
          userId: user!.id,
          assetId: newAsset.id,
          metadata: {
            fileSize,
            mimeType,
            originalFilename: file.name,
          },
        },
      })

      return newAsset
    })

    // Queue processing job if needed
    try {
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
        default:
          // Mark as completed if no processing needed
          await prisma.asset.update({
            where: { id: asset.id },
            data: { processingStatus: ProcessingStatus.COMPLETED },
          })
      }
    } catch (queueError) {
      console.error('Queue error (non-fatal):', queueError)
      // Mark as completed since file is uploaded successfully
      await prisma.asset.update({
        where: { id: asset.id },
        data: { processingStatus: ProcessingStatus.COMPLETED },
      })
    }

    return successResponse({
      asset: {
        ...asset,
        fileSize: asset.fileSize.toString(),
      },
      message: 'File uploaded successfully'
    }, undefined, 201)
    
  } catch (error) {
    console.error('Upload error:', error)
    return ApiErrors.SERVER_ERROR('Failed to upload file')
  }
}