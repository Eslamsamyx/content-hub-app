import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/collections/:id/assets - Add assets to collection
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        name: true,
      },
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
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return ApiErrors.VALIDATION_ERROR('Asset IDs are required')
    }

    // Verify all assets exist
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: assetIds },
        isArchived: false,
      },
      select: { id: true },
    })

    if (assets.length !== assetIds.length) {
      return ApiErrors.VALIDATION_ERROR('Some assets were not found or are archived')
    }

    // Get existing assets in collection to avoid duplicates
    const existingAssets = await prisma.assetCollection.findMany({
      where: {
        collectionId: id,
        assetId: { in: assetIds },
      },
      select: { assetId: true },
    })

    const existingAssetIds = new Set(existingAssets.map(a => a.assetId))
    const newAssetIds = assetIds.filter(assetId => !existingAssetIds.has(assetId))

    if (newAssetIds.length === 0) {
      return ApiErrors.VALIDATION_ERROR('All assets are already in the collection')
    }

    // Get current max position
    const maxPosition = await prisma.assetCollection.aggregate({
      where: { collectionId: id },
      _max: { position: true },
    })

    const startPosition = (maxPosition._max.position || 0) + 1

    // Add assets to collection
    await prisma.assetCollection.createMany({
      data: newAssetIds.map((assetId, index) => ({
        collectionId: id,
        assetId,
        position: startPosition + index,
        addedBy: user!.id,
      })),
    })

    // Update collection's updatedAt
    await prisma.collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_ADDED_TO_COLLECTION',
        description: `Added ${newAssetIds.length} assets to collection "${collection.name}"`,
        userId: user!.id,
        collectionId: id,
        metadata: { assetIds: newAssetIds },
      },
    })

    return successResponse({
      message: `Added ${newAssetIds.length} assets to collection`,
      addedCount: newAssetIds.length,
      skippedCount: assetIds.length - newAssetIds.length,
    })
  } catch (error) {
    console.error('Add assets to collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to add assets to collection')
  }
}

// DELETE /api/collections/:id/assets - Remove assets from collection
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
        name: true,
      },
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
    const { assetIds } = body

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return ApiErrors.VALIDATION_ERROR('Asset IDs are required')
    }

    // Remove assets from collection
    const result = await prisma.assetCollection.deleteMany({
      where: {
        collectionId: id,
        assetId: { in: assetIds },
      },
    })

    if (result.count === 0) {
      return ApiErrors.VALIDATION_ERROR('No assets found in collection to remove')
    }

    // Update collection's updatedAt
    await prisma.collection.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_REMOVED_FROM_COLLECTION',
        description: `Removed ${result.count} assets from collection "${collection.name}"`,
        userId: user!.id,
        collectionId: id,
        metadata: { assetIds },
      },
    })

    return successResponse({
      message: `Removed ${result.count} assets from collection`,
      removedCount: result.count,
    })
  } catch (error) {
    console.error('Remove assets from collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to remove assets from collection')
  }
}