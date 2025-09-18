import { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { s3Service, generateFileKey, getUploadUrl } from '@/lib/s3-enhanced'
import { validateFile, getContentType } from '@/lib/file-utils'

interface UploadPrepareRequest {
  fileName: string
  fileSize: number
  fileType?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body: UploadPrepareRequest = await request.json()
    const { fileName, fileSize, fileType } = body

    // Validate required fields
    if (!fileName || !fileSize) {
      return ApiErrors.VALIDATION_ERROR('Missing required fields: fileName, fileSize')
    }

    // Get content type
    const contentType = fileType || getContentType(fileName)

    // Validate file
    const validation = validateFile(contentType, fileSize)
    if (!validation.valid) {
      return ApiErrors.VALIDATION_ERROR(validation.error!)
    }

    // Generate unique upload ID
    const uploadId = nanoid()

    // Generate S3 key
    const assetType = contentType.split('/')[0] // Get general type (image, video, etc.)
    const fileKey = generateFileKey(fileName, assetType, user!.id)

    // Ensure S3 service is initialized
    await s3Service.initialize()
    
    // Check S3 status
    const s3Status = s3Service.getStatus()
    console.log('S3 Service Status:', {
      isConfigured: s3Status.isConfigured,
      hasBucket: !!s3Status.config.bucket,
      region: s3Status.config.region
    })

    // Generate presigned upload URL
    const uploadUrl = await getUploadUrl(fileKey, contentType)

    return successResponse({
      uploadId,
      uploadUrl,
      fileKey,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
    })
  } catch (error) {
    console.error('Upload prepare error:', error)
    return ApiErrors.SERVER_ERROR('Failed to prepare upload')
  }
}