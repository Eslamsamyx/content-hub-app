import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getUploadUrl, deleteObject } from '@/lib/s3-enhanced'
import { validateFile } from '@/lib/file-utils'

// POST /api/profile/avatar - Upload profile picture
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body = await request.json()
    const { fileName, fileSize, fileType } = body

    // Validate required fields
    if (!fileName || !fileSize || !fileType) {
      return ApiErrors.VALIDATION_ERROR('Missing required fields: fileName, fileSize, fileType')
    }

    // Validate file
    const validation = validateFile(fileType, fileSize)
    if (!validation.valid) {
      return ApiErrors.VALIDATION_ERROR(validation.error!)
    }

    // Check if it's an image
    if (!fileType.startsWith('image/')) {
      return ApiErrors.VALIDATION_ERROR('Avatar must be an image')
    }

    // Limit avatar size to 5MB
    if (fileSize > 5 * 1024 * 1024) {
      return ApiErrors.VALIDATION_ERROR('Avatar size must be less than 5MB')
    }

    // Generate S3 key for avatar
    const avatarKey = `avatars/${user!.id}/${Date.now()}_${fileName}`

    // Generate presigned upload URL
    const uploadUrl = await getUploadUrl(avatarKey, fileType)

    // Get current user to check for existing avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { avatar: true },
    })

    // Schedule deletion of old avatar after successful upload
    const oldAvatarKey = currentUser?.avatar

    return successResponse({
      uploadUrl,
      avatarKey,
      oldAvatarKey,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Avatar upload prepare error:', error)
    return ApiErrors.SERVER_ERROR('Failed to prepare avatar upload')
  }
}

// PUT /api/profile/avatar - Confirm avatar upload
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body = await request.json()
    const { avatarKey, oldAvatarKey } = body

    if (!avatarKey) {
      return ApiErrors.VALIDATION_ERROR('Avatar key is required')
    }

    // Update user avatar
    await prisma.user.update({
      where: { id: user!.id },
      data: { avatar: avatarKey },
    })

    // Delete old avatar if exists
    if (oldAvatarKey) {
      try {
        await deleteObject(oldAvatarKey)
      } catch (error) {
        console.error('Failed to delete old avatar:', error)
        // Don't fail the request if deletion fails
      }
    }

    return successResponse({
      message: 'Avatar updated successfully',
      avatar: avatarKey,
    })
  } catch (error) {
    console.error('Avatar update error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update avatar')
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get current avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { avatar: true },
    })

    if (!currentUser?.avatar) {
      return ApiErrors.VALIDATION_ERROR('No avatar to remove')
    }

    // Update user to remove avatar
    await prisma.user.update({
      where: { id: user!.id },
      data: { avatar: null },
    })

    // Delete avatar from S3
    try {
      await deleteObject(currentUser.avatar)
    } catch (error) {
      console.error('Failed to delete avatar from S3:', error)
      // Don't fail the request if deletion fails
    }

    return successResponse({
      message: 'Avatar removed successfully',
    })
  } catch (error) {
    console.error('Remove avatar error:', error)
    return ApiErrors.SERVER_ERROR('Failed to remove avatar')
  }
}