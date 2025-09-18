import { NextRequest } from 'next/server'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'
import bcrypt from 'bcryptjs'

// POST /api/share/:token/verify - Verify share password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Parse request body
    const body = await request.json()
    const { password } = body

    if (!password) {
      return ApiErrors.VALIDATION_ERROR('Password is required')
    }

    // Get share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        asset: {
          include: {
            variants: true
          }
        }
      }
    })

    if (!shareLink) {
      return ApiErrors.NOT_FOUND('Share link not found')
    }

    // Check if link is active
    if (!shareLink.isActive) {
      return ApiErrors.VALIDATION_ERROR('This share link has been revoked')
    }

    // Check expiration
    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      return ApiErrors.VALIDATION_ERROR('This share link has expired')
    }

    // Check if password is required
    if (!shareLink.password) {
      return ApiErrors.VALIDATION_ERROR('This share link does not require a password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, shareLink.password)
    if (!isValidPassword) {
      // Track failed attempts in metadata
      await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: {
          metadata: {
            ...(shareLink.metadata as object || {}),
            failedAttempts: ((shareLink.metadata as any)?.failedAttempts || 0) + 1,
            lastFailedAttempt: new Date()
          }
        }
      })
      return ApiErrors.VALIDATION_ERROR('Invalid password')
    }

    // Generate download URL if allowed
    let downloadUrl = null
    if (shareLink.allowDownload) {
      downloadUrl = await getDownloadUrl(
        shareLink.asset.fileKey,
        shareLink.asset.filename,
        3600 // 1 hour expiry
      )
    }

    // Generate variant URLs
    const variantUrls = await Promise.all(
      shareLink.asset.variants.map(async (variant) => ({
        type: variant.variantType,
        url: await getDownloadUrl(variant.fileKey, undefined, 3600)
      }))
    )

    // Update metadata to track successful verification
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        metadata: {
          ...(shareLink.metadata as object || {}),
          lastVerified: new Date(),
          verifiedFrom: {
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        }
      }
    })

    return successResponse({
      verified: true,
      downloadUrl,
      variantUrls,
      allowDownload: shareLink.allowDownload,
      message: 'Password verified successfully'
    })
  } catch (error) {
    console.error('Verify share password error:', error)
    return ApiErrors.SERVER_ERROR('Failed to verify password')
  }
}