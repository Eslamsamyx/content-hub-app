import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
    assetId: string
  }>
}

// DELETE /api/collections/:id/assets/:assetId - Remove single asset from collection
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, assetId } = await params
    
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

    // Remove asset from collection
    const result = await prisma.assetCollection.deleteMany({
      where: {
        collectionId: id,
        assetId: assetId,
      },
    })

    if (result.count === 0) {
      return ApiErrors.NOT_FOUND('Asset not found in collection')
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
        description: `Removed asset from collection "${collection.name}"`,
        userId: user!.id,
        collectionId: id,
        assetId: assetId,
        metadata: { assetId },
      },
    })

    return successResponse({
      message: 'Asset removed from collection',
      success: true,
    })
  } catch (error) {
    console.error('Remove asset from collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to remove asset from collection')
  }
}