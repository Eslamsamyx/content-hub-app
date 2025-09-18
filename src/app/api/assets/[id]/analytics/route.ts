import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { AnalyticsService } from '@/lib/analytics-service'

// GET /api/assets/:id/analytics - Individual asset analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '30d'

    // Check if asset exists and user has access
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        uploadedById: true,
        visibility: true
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    // Check permissions - owner can always view, others need general analytics permission
    const isOwner = asset.uploadedById === user!.id
    const hasAnalyticsPermission = user!.role === 'ADMIN' || user!.role === 'CONTENT_MANAGER'
    
    if (!isOwner && !hasAnalyticsPermission) {
      return ApiErrors.FORBIDDEN()
    }

    // Get asset analytics
    const analytics = await AnalyticsService.getAssetAnalytics(id, period)

    // Get additional context
    const [
      totalCollections,
      totalFavorites,
      recentActivity
    ] = await Promise.all([
      // Collections containing this asset
      prisma.assetCollection.count({
        where: { assetId: id }
      }),
      
      // Users who favorited
      prisma.favorite.count({
        where: { assetId: id }
      }),
      
      // Recent activity (last 10)
      prisma.activity.findMany({
        where: { assetId: id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Format response
    return successResponse({
      assetId: id,
      assetTitle: asset.title,
      period: period === 'all' ? 'All time' : AnalyticsService.PERIODS[period]?.label || period,
      summary: {
        ...analytics.summary,
        collections: totalCollections,
        favorites: totalFavorites
      },
      trends: analytics.trends,
      topUsers: analytics.topUsers,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        user: activity.user,
        createdAt: activity.createdAt,
        description: activity.description || generateActivityDescription(activity)
      })),
      engagement: {
        engagementRate: analytics.summary.views > 0
          ? ((analytics.summary.downloads / analytics.summary.views) * 100).toFixed(1)
          : '0',
        shareRate: analytics.summary.views > 0
          ? ((analytics.summary.shares / analytics.summary.views) * 100).toFixed(1)
          : '0'
      }
    })
  } catch (error) {
    console.error('Get asset analytics error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch asset analytics')
  }
}

// Helper function to generate activity descriptions
function generateActivityDescription(activity: any): string {
  const userName = activity.user?.name || activity.user?.email || 'Unknown user'
  
  const descriptions: Record<string, string> = {
    ASSET_VIEWED: `${userName} viewed this asset`,
    ASSET_DOWNLOADED: `${userName} downloaded this asset`,
    ASSET_UPDATED: `${userName} updated this asset`,
    ASSET_SHARED: `${userName} shared this asset`,
    ASSET_ADDED_TO_COLLECTION: `${userName} added to a collection`,
    ASSET_SUBMITTED_FOR_REVIEW: `${userName} submitted for review`,
    ASSET_APPROVED: `${userName} approved this asset`,
    ASSET_REJECTED: `${userName} rejected this asset`
  }

  return descriptions[activity.type] || `${userName} performed an action`
}