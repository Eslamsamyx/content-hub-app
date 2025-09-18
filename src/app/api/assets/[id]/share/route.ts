import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { serializeAsset } from '@/lib/utils/serialize'

// POST /api/assets/:id/share - Create shareable link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Parse request body
    const body = await request.json()
    const {
      password,
      expiresAt,
      maxDownloads,
      allowDownload = true,
      requireAuth: requireAuthForAccess = false
    } = body

    // Get asset
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        uploadedById: true,
        visibility: true,
        usage: true
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    // Check permissions
    const isOwner = asset.uploadedById === user!.id
    const canShare = hasPermission(user!, 'share_assets') || isOwner

    if (!canShare) {
      return ApiErrors.FORBIDDEN()
    }

    // Check if asset can be shared
    // Allow sharing for internal assets too if user has permission
    const canShareInternal = asset.visibility === 'INTERNAL' && (isOwner || hasPermission(user!, 'share_internal_assets'))
    const canShareExternal = asset.visibility === 'EXTERNAL'
    
    if (!canShareInternal && !canShareExternal && !hasPermission(user!, 'override_visibility')) {
      return ApiErrors.VALIDATION_ERROR('This asset cannot be shared')
    }

    // Generate unique token
    const token = nanoid(32)

    // Hash password if provided
    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    // Parse expiration date
    let expirationDate = null
    if (expiresAt) {
      expirationDate = new Date(expiresAt)
      if (expirationDate < new Date()) {
        return ApiErrors.VALIDATION_ERROR('Expiration date must be in the future')
      }
    }

    // Create share link
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        assetId: asset.id,
        createdById: user!.id,
        password: hashedPassword,
        expiresAt: expirationDate,
        maxDownloads: maxDownloads || null,
        allowDownload,
        metadata: {
          requireAuth: requireAuthForAccess,
          createdFrom: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        }
      },
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            type: true,
            fileSize: true
          }
        }
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_SHARED',
        description: `Created share link for "${asset.title}"`,
        userId: user!.id,
        assetId: asset.id,
        metadata: {
          shareLinkId: shareLink.id,
          hasPassword: !!password,
          hasExpiry: !!expiresAt,
          maxDownloads
        }
      }
    })

    // Build share URL with language prefix (default to 'en')
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`
    // Extract language from referrer or default to 'en'
    const referrer = request.headers.get('referer') || ''
    const lngMatch = referrer.match(/\/(en|fr|es|de|ar|zh)\//)
    const lng = lngMatch ? lngMatch[1] : 'en'
    const shareUrl = `${baseUrl}/${lng}/share/${token}`

    return successResponse({
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      asset: serializeAsset(shareLink.asset), // Use serialization utility
      settings: {
        hasPassword: !!password,
        expiresAt: shareLink.expiresAt,
        maxDownloads: shareLink.maxDownloads,
        allowDownload: shareLink.allowDownload,
        requireAuth: requireAuthForAccess
      },
      createdAt: shareLink.createdAt
    })
  } catch (error) {
    console.error('Create share link error:', error)
    return ApiErrors.SERVER_ERROR('Failed to create share link')
  }
}

// GET /api/assets/:id/shares - List asset's share links
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Get asset to check ownership
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        uploadedById: true
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    // Check permissions
    const isOwner = asset.uploadedById === user!.id
    const canViewShares = hasPermission(user!, 'manage_all_assets') || isOwner

    if (!canViewShares) {
      return ApiErrors.FORBIDDEN()
    }

    // Get share links
    const shareLinks = await prisma.shareLink.findMany({
      where: {
        assetId: id,
        isActive: true
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Build share URLs with language prefix
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`
    // Extract language from referrer or default to 'en'
    const referrer = request.headers.get('referer') || ''
    const lngMatch = referrer.match(/\/(en|fr|es|de|ar|zh)\//)
    const lng = lngMatch ? lngMatch[1] : 'en'
    const linksWithUrls = shareLinks.map(link => ({
      id: link.id,
      token: link.token,
      shareUrl: `${baseUrl}/${lng}/share/${link.token}`,
      createdBy: link.createdBy,
      createdAt: link.createdAt,
      lastAccessedAt: link.lastAccessedAt,
      settings: {
        hasPassword: !!link.password,
        expiresAt: link.expiresAt,
        maxDownloads: link.maxDownloads,
        currentDownloads: link.currentDownloads,
        allowDownload: link.allowDownload
      },
      status: {
        isActive: link.isActive,
        isExpired: link.expiresAt ? link.expiresAt < new Date() : false,
        downloadsRemaining: link.maxDownloads 
          ? Math.max(0, link.maxDownloads - link.currentDownloads)
          : null
      }
    }))

    return successResponse({
      shareLinks: linksWithUrls,
      total: linksWithUrls.length
    })
  } catch (error) {
    console.error('List share links error:', error)
    return ApiErrors.SERVER_ERROR('Failed to list share links')
  }
}