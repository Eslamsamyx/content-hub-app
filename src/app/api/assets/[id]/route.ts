import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'
import { Visibility, UsageType } from '@prisma/client'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/assets/:id - Get single asset details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Use optional authentication - allow public access
    const { optionalAuth } = await import('@/lib/auth-middleware')
    const { user } = await optionalAuth(request)

    // Get asset with all relations
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        metadata: true,
        variants: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            downloads: true,
            favorites: true,
            collections: true,
            externalLinks: true,
          },
        },
      },
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset')
    }

    // Check if user has permission to view this asset
    const isPublic = asset.visibility === Visibility.EXTERNAL && 
                    asset.usage === UsageType.PUBLIC && 
                    asset.readyForPublishing
    
    if (!isPublic && !user) {
      return ApiErrors.UNAUTHORIZED()
    }
    
    if (!isPublic && user && !hasPermission(user, 'asset.read', asset)) {
      return ApiErrors.FORBIDDEN()
    }

    // Generate temporary URLs for viewing
    const [viewUrl, thumbnailUrl, previewUrl] = await Promise.all([
      getDownloadUrl(asset.fileKey, undefined, 3600), // 1 hour
      asset.thumbnailKey ? getDownloadUrl(asset.thumbnailKey, undefined, 3600) : null,
      asset.previewKey ? getDownloadUrl(asset.previewKey, undefined, 3600) : null,
    ])

    // Update view count
    await prisma.asset.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    // Create view activity only if user is authenticated
    if (user) {
      await prisma.activity.create({
        data: {
          type: 'ASSET_VIEWED',
          description: `Viewed ${asset.title}`,
          userId: user.id,
          assetId: asset.id,
        },
      })
    }

    // Transform response
    const response = {
      ...asset,
      fileSize: asset.fileSize.toString(),
      tags: asset.tags.map(at => at.tag),
      viewUrl,
      thumbnailUrl,
      previewUrl,
      stats: {
        downloads: asset._count.downloads,
        favorites: asset._count.favorites,
        collections: asset._count.collections,
        shares: asset._count.externalLinks,
        views: asset.viewCount + 1, // Include current view
      },
    }

    return successResponse(response)
  } catch (error) {
    console.error('Get asset error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch asset')
  }
}

// PATCH /api/assets/:id - Update asset metadata
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get the asset first to check ownership
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { uploadedById: true },
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset')
    }

    // Check permission
    const isOwner = asset.uploadedById === user!.id
    const canUpdate = hasPermission(user!, 'asset.update') || 
                     (isOwner && hasPermission(user!, 'asset.update.own'))
    
    if (!canUpdate) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      category,
      eventName,
      company,
      project,
      campaign,
      productionYear,
      visibility,
      usage,
      readyForPublishing,
      tags,
    } = body

    // Update asset
    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(eventName !== undefined && { eventName }),
        ...(company !== undefined && { company }),
        ...(project !== undefined && { project }),
        ...(campaign !== undefined && { campaign }),
        ...(productionYear !== undefined && { productionYear }),
        ...(visibility && { visibility: visibility as Visibility }),
        ...(usage && { usage: usage === 'public' ? UsageType.PUBLIC : UsageType.INTERNAL }),
        ...(readyForPublishing !== undefined && { readyForPublishing }),
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
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Update tags in a transaction if provided
    if (tags !== undefined && Array.isArray(tags)) {
      await prisma.$transaction(async (tx) => {
        // Remove existing tags
        await tx.assetTag.deleteMany({
          where: { assetId: id },
        })

        // Add new tags
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
              assetId: id,
              tagId: tag.id,
              addedBy: user!.id,
            })),
          })
        }
      })
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_UPDATED',
        description: `Updated ${updatedAsset.title}`,
        userId: user!.id,
        assetId: id,
        metadata: body,
      },
    })

    // Transform response
    const response = {
      ...updatedAsset,
      fileSize: updatedAsset.fileSize.toString(),
      tags: updatedAsset.tags.map(at => at.tag),
    }

    return successResponse(response)
  } catch (error) {
    console.error('Update asset error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update asset')
  }
}

// DELETE /api/assets/:id - Delete (archive) asset
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get the asset first to check ownership
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: { uploadedById: true, title: true },
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset')
    }

    // Check permission
    const isOwner = asset.uploadedById === user!.id
    const canDelete = hasPermission(user!, 'asset.delete') || 
                     (isOwner && hasPermission(user!, 'asset.delete.own'))
    
    if (!canDelete) {
      return ApiErrors.FORBIDDEN()
    }

    // Soft delete - just archive the asset
    await prisma.asset.update({
      where: { id },
      data: { isArchived: true },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_ARCHIVED',
        description: `Archived ${asset.title}`,
        userId: user!.id,
        assetId: id,
      },
    })

    return successResponse({ message: 'Asset archived successfully' })
  } catch (error) {
    console.error('Delete asset error:', error)
    return ApiErrors.SERVER_ERROR('Failed to delete asset')
  }
}