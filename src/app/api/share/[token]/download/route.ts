import { NextRequest } from 'next/server'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

// POST /api/share/:token/download - Track download and get fresh URL
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Parse request body for optional password
    const body = await request.json().catch(() => ({}))
    const { password } = body

    // Get share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        asset: true
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

    // Check if downloads are allowed
    if (!shareLink.allowDownload) {
      return ApiErrors.FORBIDDEN()
    }

    // Check download limit
    if (shareLink.maxDownloads && shareLink.currentDownloads >= shareLink.maxDownloads) {
      return ApiErrors.VALIDATION_ERROR('Download limit reached for this share link')
    }

    // Verify password if required
    if (shareLink.password) {
      if (!password) {
        return ApiErrors.VALIDATION_ERROR('Password is required')
      }
      
      const bcrypt = await import('bcryptjs')
      const isValidPassword = await bcrypt.compare(password, shareLink.password)
      if (!isValidPassword) {
        return ApiErrors.VALIDATION_ERROR('Invalid password')
      }
    }

    // Update download count
    const updatedShareLink = await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        currentDownloads: {
          increment: 1
        },
        lastAccessedAt: new Date(),
        metadata: {
          ...(shareLink.metadata as object || {}),
          downloads: [
            ...((shareLink.metadata as any)?.downloads || []),
            {
              timestamp: new Date(),
              ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
              userAgent: request.headers.get('user-agent')
            }
          ].slice(-100) // Keep last 100 download records
        }
      }
    })

    // Note: We don't create a download record for anonymous downloads since userId is required
    // The download is tracked in the shareLink metadata instead

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_DOWNLOADED',
        userId: shareLink.createdById, // Log to share creator
        assetId: shareLink.assetId,
        description: 'Asset downloaded via share link',
        metadata: {
          shareLinkId: shareLink.id,
          downloadCount: updatedShareLink.currentDownloads,
          remainingDownloads: shareLink.maxDownloads 
            ? Math.max(0, shareLink.maxDownloads - updatedShareLink.currentDownloads)
            : null
        }
      }
    })

    // Generate fresh download URL
    const downloadUrl = await getDownloadUrl(
      shareLink.asset.fileKey,
      shareLink.asset.filename,
      300 // 5 minutes for actual download
    )

    return successResponse({
      downloadUrl,
      filename: shareLink.asset.filename,
      fileSize: shareLink.asset.fileSize.toString(),
      mimeType: shareLink.asset.mimeType,
      downloadsRemaining: shareLink.maxDownloads 
        ? Math.max(0, shareLink.maxDownloads - updatedShareLink.currentDownloads)
        : null
    })
  } catch (error) {
    console.error('Share download error:', error)
    return ApiErrors.SERVER_ERROR('Failed to process download')
  }
}