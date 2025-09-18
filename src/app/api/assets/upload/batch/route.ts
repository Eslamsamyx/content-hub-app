import { NextRequest } from 'next/server'
import { nanoid } from 'nanoid'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { generateFileKey, getUploadUrl } from '@/lib/s3-enhanced'
import { validateFile, getContentType } from '@/lib/file-utils'

interface BatchUploadFile {
  fileName: string
  fileSize: number
  fileType?: string
}

interface BatchUploadRequest {
  files: BatchUploadFile[]
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
    const body: BatchUploadRequest = await request.json()
    const { files } = body

    // Validate request
    if (!files || !Array.isArray(files) || files.length === 0) {
      return ApiErrors.VALIDATION_ERROR('No files provided')
    }

    if (files.length > 100) {
      return ApiErrors.VALIDATION_ERROR('Maximum 100 files per batch')
    }

    // Generate batch ID for grouping
    const batchId = nanoid()

    // Process each file
    const uploadUrls = await Promise.all(
      files.map(async (file) => {
        const { fileName, fileSize, fileType } = file

        // Validate required fields
        if (!fileName || !fileSize) {
          throw new Error(`Invalid file data for ${fileName}`)
        }

        // Get content type
        const contentType = fileType || getContentType(fileName)

        // Validate file
        const validation = validateFile(contentType, fileSize)
        if (!validation.valid) {
          throw new Error(`${fileName}: ${validation.error}`)
        }

        // Generate unique upload ID
        const uploadId = nanoid()

        // Generate S3 key
        const assetType = contentType.split('/')[0]
        const fileKey = generateFileKey(fileName, assetType, user!.id)

        // Generate presigned upload URL
        const uploadUrl = await getUploadUrl(fileKey, contentType)

        return {
          uploadId,
          fileName,
          uploadUrl,
          fileKey,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
      })
    )

    return successResponse({
      batchId,
      uploads: uploadUrls,
      totalFiles: uploadUrls.length,
    })
  } catch (error) {
    console.error('Batch upload prepare error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to prepare batch upload'
    return ApiErrors.SERVER_ERROR(errorMessage)
  }
}