import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { s3Service, generateFileKey } from '@/lib/s3-enhanced'
import { prisma } from '@/lib/prisma'
import { successResponse, ApiErrors } from '@/lib/api-response'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return ApiErrors.UNAUTHORIZED()
    }

    const user = session.user as any
    console.log('🔐 User authenticated:', { id: user.id, email: user.email })

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tags = formData.get('tags') as string
    const description = formData.get('description') as string

    if (!file) {
      return ApiErrors.VALIDATION_ERROR('File is required')
    }

    console.log('📤 Direct upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Initialize S3 service
    await s3Service.initialize()

    // Generate file key
    const assetType = file.type.split('/')[0]
    const fileKey = generateFileKey(file.name, assetType, user.id)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload directly to S3
    await s3Service.uploadFile(
      fileKey,
      buffer,
      file.type,
      {
        'original-name': file.name,
        'uploaded-by': user.id,
        'upload-date': new Date().toISOString()
      }
    )

    console.log('✅ File uploaded to S3:', fileKey)

    // Determine asset type based on MIME type
    const getAssetType = (mimeType: string) => {
      if (mimeType.startsWith('image/')) return 'IMAGE'
      if (mimeType.startsWith('video/')) return 'VIDEO'
      if (mimeType.startsWith('audio/')) return 'AUDIO'
      if (mimeType === 'application/pdf' || mimeType.includes('document')) return 'DOCUMENT'
      if (mimeType.includes('model') || mimeType.includes('gltf') || mimeType.includes('usdz')) return 'MODEL_3D'
      return 'DESIGN' // Default to DESIGN for other types
    }

    // Save asset record to database
    const asset = await prisma.asset.create({
      data: {
        title: file.name.split('.')[0], // Remove extension for title
        description: description || null,
        filename: file.name,
        originalFilename: file.name,
        fileKey: fileKey,
        fileSize: BigInt(file.size),
        mimeType: file.type,
        format: file.name.split('.').pop()?.toLowerCase() || 'unknown',
        type: getAssetType(file.type),
        category: 'General',
        uploadedById: user.id,
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED'
      }
    })

    console.log('💾 Asset saved to database:', asset.id)

    // Handle tags if provided
    if (tags) {
      const tagNames = tags.split(',').map(t => t.trim()).filter(Boolean)
      if (tagNames.length > 0) {
        console.log('🏷️ Processing tags:', tagNames)
        
        // Create or find tags and associate with asset
        for (const tagName of tagNames) {
          try {
            // First, try to find or create the tag
            const tag = await prisma.tag.upsert({
              where: { name: tagName },
              update: { usageCount: { increment: 1 } },
              create: {
                name: tagName,
                slug: tagName.toLowerCase().replace(/\s+/g, '-'),
                category: 'CUSTOM',
                usageCount: 1
              }
            })

            // Then associate it with the asset
            await prisma.assetTag.create({
              data: {
                assetId: asset.id,
                tagId: tag.id,
                addedBy: user.id
              }
            })
          } catch (tagError) {
            console.warn('⚠️ Failed to add tag:', tagName, tagError)
            // Continue with other tags even if one fails
          }
        }
        console.log('✅ Tags processed successfully')
      }
    }

    // Generate direct S3 URL for immediate verification
    const directUrl = await s3Service.getDownloadUrl(
      asset.fileKey,
      asset.filename,
      3600 // 1 hour
    )

    return successResponse({
      id: asset.id,
      fileName: asset.filename,
      fileKey: asset.fileKey,
      fileSize: Number(asset.fileSize),
      mimeType: asset.mimeType,
      downloadUrl: `/api/assets/${asset.id}/download`,
      directUrl: directUrl, // Direct S3 link for immediate access
      viewUrl: `/api/assets/${asset.id}`, // View asset details
      message: 'File uploaded successfully'
    })

  } catch (error: any) {
    console.error('❌ Direct upload error:', error)
    return ApiErrors.SERVER_ERROR(`Upload failed: ${error.message}`)
  }
}