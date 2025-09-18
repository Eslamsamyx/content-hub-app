import { NextRequest } from 'next/server'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { ActivityService } from '@/lib/activity-service'

// POST /api/assets/:id/view - Track asset view
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use optional authentication - allow public access
    const { optionalAuth } = await import('@/lib/auth-middleware')
    const { user } = await optionalAuth(request)

    const { id } = await params

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 View tracking called for asset:', id, 'by user:', user?.email || 'anonymous')
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        isArchived: true,
        visibility: true,
        usage: true,
        readyForPublishing: true
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    if (asset.isArchived) {
      return ApiErrors.VALIDATION_ERROR('Cannot track views for archived assets')
    }

    // Log the view activity only for authenticated users
    if (user) {
      await ActivityService.logAssetView(user.id, id)
    }

    // Update asset analytics for the current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.assetAnalytics.upsert({
      where: {
        assetId_date: {
          assetId: id,
          date: today
        }
      },
      update: {
        views: { increment: 1 }
      },
      create: {
        assetId: id,
        date: today,
        views: 1,
        downloads: 0
      }
    })

    // Get updated view count
    const totalViews = await prisma.activity.count({
      where: {
        assetId: id,
        type: 'ASSET_VIEWED'
      }
    })

    return successResponse({
      assetId: id,
      viewed: true,
      totalViews,
      message: 'View tracked successfully'
    })
  } catch (error) {
    console.error('Track asset view error:', error)
    return ApiErrors.SERVER_ERROR('Failed to track asset view')
  }
}