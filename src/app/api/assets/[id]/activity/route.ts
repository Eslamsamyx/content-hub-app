import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { ActivityService } from '@/lib/activity-service'
import { prisma } from '@/lib/prisma'

// GET /api/assets/:id/activity - Asset activity log
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        uploadedById: true
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    // Get asset activity
    const activities = await ActivityService.getAssetActivity(id, limit)

    // Format activities
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      user: activity.user,
      createdAt: activity.createdAt,
      description: generateActivityDescription(activity, asset.title),
      metadata: activity.metadata
    }))

    // Get activity summary
    const activityTypes = await prisma.activity.groupBy({
      by: ['type'],
      where: { assetId: id },
      _count: true
    })

    const summary = activityTypes.reduce((acc, item) => {
      acc[item.type.toLowerCase()] = item._count
      return acc
    }, {} as Record<string, number>)

    return successResponse({
      assetId: id,
      assetTitle: asset.title,
      activities: formattedActivities,
      summary,
      total: formattedActivities.length
    })
  } catch (error) {
    console.error('Get asset activity error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch asset activity')
  }
}

// Helper function to generate activity descriptions
function generateActivityDescription(activity: any, assetTitle: string): string {
  const userName = activity.user ? `${activity.user.firstName} ${activity.user.lastName}`.trim() || activity.user.email : 'Unknown user'
  
  const descriptions: Record<string, string> = {
    ASSET_UPLOADED: `${userName} uploaded "${assetTitle}"`,
    ASSET_VIEWED: `${userName} viewed this asset`,
    ASSET_DOWNLOADED: `${userName} downloaded this asset`,
    ASSET_UPDATED: `${userName} updated this asset`,
    ASSET_SHARED: `${userName} shared this asset`,
    ASSET_ADDED_TO_COLLECTION: `${userName} added this asset to a collection`,
    ASSET_REMOVED_FROM_COLLECTION: `${userName} removed this asset from a collection`,
    ASSET_SUBMITTED_FOR_REVIEW: `${userName} submitted this asset for review`,
    ASSET_APPROVED: `${userName} approved this asset`,
    ASSET_REJECTED: `${userName} rejected this asset`,
    CHANGES_REQUESTED: `${userName} requested changes for this asset`,
    ASSET_ARCHIVED: `${userName} archived this asset`,
    ASSET_DELETED: `${userName} deleted this asset`
  }

  return descriptions[activity.type] || `${userName} performed an action`
}