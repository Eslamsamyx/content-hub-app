import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// POST /api/collections/:id/pin - Pin/unpin collection
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
        isPinned: true,
        name: true,
      },
    })

    if (!collection) {
      return ApiErrors.NOT_FOUND('Collection')
    }

    // Check permission - only owner can pin/unpin their collections
    if (collection.createdById !== user!.id) {
      return ApiErrors.FORBIDDEN()
    }

    // Toggle pin status
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        isPinned: !collection.isPinned,
        sortOrder: !collection.isPinned ? 1 : 0, // Pinned collections have higher sort order
      },
    })

    return successResponse({
      id: updatedCollection.id,
      isPinned: updatedCollection.isPinned,
      message: updatedCollection.isPinned ? 'Collection pinned' : 'Collection unpinned',
    })
  } catch (error) {
    console.error('Pin/unpin collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update collection pin status')
  }
}