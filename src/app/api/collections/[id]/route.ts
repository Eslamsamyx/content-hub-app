import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/collections/:id - Get collection details with assets
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'collection.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get collection with assets
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        assets: {
          orderBy: { position: 'asc' },
          include: {
            asset: {
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
                _count: {
                  select: {
                    downloads: true,
                    favorites: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!collection) {
      return ApiErrors.NOT_FOUND('Collection')
    }

    // Check access permissions
    if (!collection.isPublic && collection.createdById !== user!.id) {
      // Check if user is admin or content manager
      if (!['ADMIN', 'CONTENT_MANAGER'].includes(user!.role)) {
        return ApiErrors.FORBIDDEN()
      }
    }

    // Transform assets with URLs
    const transformedAssets = await Promise.all(
      collection.assets.map(async (item) => {
        const asset = item.asset
        const [viewUrl, thumbnailUrl] = await Promise.all([
          getDownloadUrl(asset.fileKey, undefined, 3600),
          asset.thumbnailKey ? getDownloadUrl(asset.thumbnailKey, undefined, 3600) : null,
        ])

        return {
          id: asset.id,
          title: asset.title,
          description: asset.description,
          type: asset.type,
          fileSize: asset.fileSize.toString(),
          mimeType: asset.mimeType,
          viewUrl,
          thumbnailUrl,
          tags: asset.tags.map(at => at.tag),
          uploadedBy: asset.uploadedBy,
          stats: {
            downloads: asset._count.downloads,
            favorites: asset._count.favorites,
            views: asset.viewCount,
          },
          position: item.position,
          addedAt: item.addedAt,
        }
      })
    )

    // Get cover image URL
    let coverImageUrl = null
    if (collection.coverImage) {
      coverImageUrl = await getDownloadUrl(collection.coverImage, undefined, 3600)
    } else if (transformedAssets[0]?.thumbnailUrl) {
      coverImageUrl = transformedAssets[0].thumbnailUrl
    }

    return successResponse({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImage: coverImageUrl,
      isPublic: collection.isPublic,
      isPinned: collection.isPinned,
      createdBy: collection.createdBy,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      assets: transformedAssets,
      itemCount: transformedAssets.length,
    })
  } catch (error) {
    console.error('Get collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch collection')
  }
}

// PATCH /api/collections/:id - Update collection metadata
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get collection to check ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: { createdById: true },
    })

    if (!collection) {
      return ApiErrors.NOT_FOUND('Collection')
    }

    // Check permission
    const isOwner = collection.createdById === user!.id
    const canUpdate = hasPermission(user!, 'collection.update') || 
                     (isOwner && hasPermission(user!, 'collection.update.own'))
    
    if (!canUpdate) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const { name, description, isPublic, coverImage } = body

    // Update collection
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic }),
        ...(coverImage !== undefined && { coverImage }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'COLLECTION_UPDATED',
        description: `Updated collection "${updatedCollection.name}"`,
        userId: user!.id,
        collectionId: id,
        metadata: body,
      },
    })

    return successResponse({
      id: updatedCollection.id,
      name: updatedCollection.name,
      description: updatedCollection.description,
      isPublic: updatedCollection.isPublic,
      isPinned: updatedCollection.isPinned,
      itemCount: updatedCollection._count.assets,
      createdBy: updatedCollection.createdBy,
      createdAt: updatedCollection.createdAt,
      updatedAt: updatedCollection.updatedAt,
    })
  } catch (error) {
    console.error('Update collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update collection')
  }
}

// DELETE /api/collections/:id - Delete collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get collection to check ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        createdById: true,
        _count: {
          select: { assets: true },
        },
      },
    })

    if (!collection) {
      return ApiErrors.NOT_FOUND('Collection')
    }

    // Check permission
    const isOwner = collection.createdById === user!.id
    const canDelete = hasPermission(user!, 'collection.delete') || 
                     (isOwner && hasPermission(user!, 'collection.delete.own'))
    
    if (!canDelete) {
      return ApiErrors.FORBIDDEN()
    }

    // Delete collection (cascade will handle asset relationships)
    await prisma.collection.delete({
      where: { id },
    })

    return successResponse({
      message: 'Collection deleted successfully',
      deletedAssets: collection._count.assets,
    })
  } catch (error) {
    console.error('Delete collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to delete collection')
  }
}