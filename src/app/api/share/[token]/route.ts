import { NextRequest } from 'next/server'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/share/:token - Access shared asset (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get share link with asset details
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        asset: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            },
            variants: true,
            _count: {
              select: {
                downloads: true,
                collections: true,
                favorites: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
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

    // Check download limit
    if (shareLink.maxDownloads && shareLink.currentDownloads >= shareLink.maxDownloads) {
      return ApiErrors.VALIDATION_ERROR('Download limit reached for this share link')
    }

    // Check if authentication is required
    const metadata = shareLink.metadata as any
    if (metadata?.requireAuth) {
      const session = await getServerSession(authOptions)
      if (!session) {
        return ApiErrors.UNAUTHORIZED()
      }
    }

    // Check if password is required (don't validate here, just indicate)
    const requiresPassword = !!shareLink.password

    // Update last accessed time
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        lastAccessedAt: new Date(),
        metadata: {
          ...(shareLink.metadata as object || {}),
          lastAccess: {
            timestamp: new Date(),
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
            userAgent: request.headers.get('user-agent')
          }
        }
      }
    })

    // Generate URLs for asset
    const [thumbnailUrl, previewUrl] = await Promise.all([
      shareLink.asset.thumbnailKey 
        ? getDownloadUrl(shareLink.asset.thumbnailKey, undefined, 3600)
        : null,
      shareLink.asset.previewKey
        ? getDownloadUrl(shareLink.asset.previewKey, undefined, 3600)
        : null
    ])

    // Don't include download URL yet if password is required
    let downloadUrl = null
    if (!requiresPassword && shareLink.allowDownload) {
      downloadUrl = await getDownloadUrl(
        shareLink.asset.fileKey, 
        shareLink.asset.filename, 
        3600
      )
    }

    return successResponse({
      requiresPassword,
      asset: {
        id: shareLink.asset.id,
        title: shareLink.asset.title,
        description: shareLink.asset.description,
        type: shareLink.asset.type,
        category: shareLink.asset.category,
        filename: shareLink.asset.filename,
        fileSize: shareLink.asset.fileSize.toString(),
        mimeType: shareLink.asset.mimeType,
        format: shareLink.asset.format,
        thumbnailUrl,
        previewUrl,
        downloadUrl, // Will be null if password required
        uploadedBy: shareLink.asset.uploadedBy,
        uploadedAt: shareLink.asset.createdAt,
        tags: shareLink.asset.tags.map(at => ({
          id: at.tag.id,
          name: at.tag.name,
          slug: at.tag.slug,
          color: at.tag.color
        })),
        metadata: {
          width: shareLink.asset.width,
          height: shareLink.asset.height,
          duration: shareLink.asset.duration,
          company: shareLink.asset.company,
          eventName: shareLink.asset.eventName,
          project: shareLink.asset.project,
          productionYear: shareLink.asset.productionYear
        },
        stats: {
          downloadCount: shareLink.asset._count.downloads,
          collectionCount: shareLink.asset._count.collections,
          favoriteCount: shareLink.asset._count.favorites
        }
      },
      shareSettings: {
        allowDownload: shareLink.allowDownload,
        expiresAt: shareLink.expiresAt,
        sharedBy: `${shareLink.createdBy.firstName} ${shareLink.createdBy.lastName}`.trim(),
        sharedAt: shareLink.createdAt
      }
    })
  } catch (error) {
    console.error('Access share link error:', error)
    return ApiErrors.SERVER_ERROR('Failed to access shared asset')
  }
}

// DELETE /api/share/:token - Revoke share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Check authentication - only authenticated users can revoke
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return ApiErrors.UNAUTHORIZED()
    }

    const { token } = await params

    // Get share link
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            uploadedById: true
          }
        }
      }
    })

    if (!shareLink) {
      return ApiErrors.NOT_FOUND('Share link not found')
    }

    // Check permissions
    const isCreator = shareLink.createdById === session.user.id
    const isAssetOwner = shareLink.asset.uploadedById === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'CONTENT_MANAGER'

    if (!isCreator && !isAssetOwner && !isAdmin) {
      return ApiErrors.FORBIDDEN()
    }

    // Soft delete - mark as inactive
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        isActive: false
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'SHARE_LINK_REVOKED',
        description: `Revoked share link for "${shareLink.asset.title}"`,
        userId: session.user.id,
        assetId: shareLink.assetId,
        metadata: {
          shareLinkId: shareLink.id,
          revokedBy: (session.user as any).name || session.user.email
        }
      }
    })

    return successResponse({
      message: 'Share link revoked successfully'
    })
  } catch (error) {
    console.error('Revoke share link error:', error)
    return ApiErrors.SERVER_ERROR('Failed to revoke share link')
  }
}