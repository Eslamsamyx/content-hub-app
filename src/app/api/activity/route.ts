import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

// GET /api/activity - Get activity feed
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') as ActivityType | null
    const userId = searchParams.get('userId')
    const assetId = searchParams.get('assetId')
    const collectionId = searchParams.get('collectionId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    // Build where clause
    const where: any = {}

    // Filter by activity type
    if (type) {
      where.type = type
    }

    // Filter by user (check permissions)
    if (userId) {
      if (userId !== user!.id && !hasPermission(user!, 'view_all_activity')) {
        return ApiErrors.FORBIDDEN()
      }
      where.userId = userId
    } else if (!hasPermission(user!, 'view_all_activity')) {
      // Non-admins can only see their own activity by default
      where.userId = user!.id
    }

    // Filter by asset
    if (assetId) {
      where.assetId = assetId
    }

    // Filter by collection
    if (collectionId) {
      where.collectionId = collectionId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Get total count
    const total = await prisma.activity.count({ where })

    // Get activities with related data
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        asset: {
          select: {
            id: true,
            title: true,
            type: true,
            thumbnailKey: true
          }
        },
        collection: {
          select: {
            id: true,
            name: true,
            isPublic: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Generate thumbnail URLs for assets
    const { getDownloadUrl } = await import('@/lib/s3')
    const activitiesWithUrls = await Promise.all(
      activities.map(async (activity) => {
        let assetThumbnailUrl = null
        if (activity.asset?.thumbnailKey) {
          assetThumbnailUrl = await getDownloadUrl(activity.asset.thumbnailKey, undefined, 3600)
        }

        return {
          id: activity.id,
          type: activity.type,
          description: activity.description || generateActivityDescription(activity),
          user: activity.user,
          asset: activity.asset ? {
            ...activity.asset,
            thumbnailUrl: assetThumbnailUrl
          } : null,
          collection: activity.collection,
          metadata: activity.metadata,
          createdAt: activity.createdAt
        }
      })
    )

    // Get activity statistics
    const stats = await getActivityStats(where)

    return successResponse({
      activities: activitiesWithUrls,
      stats,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get activity feed error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch activity feed')
  }
}

// Helper function to generate activity descriptions
function generateActivityDescription(activity: any): string {
  const userName = activity.user ? `${activity.user.firstName} ${activity.user.lastName}`.trim() || activity.user.email : 'Unknown user'
  
  switch (activity.type) {
    case 'ASSET_UPLOADED':
      return `${userName} uploaded ${activity.asset?.title || 'an asset'}`
    case 'ASSET_UPDATED':
      return `${userName} updated ${activity.asset?.title || 'an asset'}`
    case 'ASSET_DOWNLOADED':
      return `${userName} downloaded ${activity.asset?.title || 'an asset'}`
    case 'ASSET_VIEWED':
      return `${userName} viewed ${activity.asset?.title || 'an asset'}`
    case 'ASSET_SHARED':
      return `${userName} shared ${activity.asset?.title || 'an asset'}`
    case 'ASSET_ARCHIVED':
      return `${userName} archived ${activity.asset?.title || 'an asset'}`
    case 'ASSET_DELETED':
      return `${userName} deleted ${activity.asset?.title || 'an asset'}`
    case 'COLLECTION_CREATED':
      return `${userName} created collection ${activity.collection?.name || 'a collection'}`
    case 'COLLECTION_UPDATED':
      return `${userName} updated collection ${activity.collection?.name || 'a collection'}`
    case 'ASSET_ADDED_TO_COLLECTION':
      return `${userName} added ${activity.asset?.title || 'an asset'} to ${activity.collection?.name || 'a collection'}`
    case 'ASSET_REMOVED_FROM_COLLECTION':
      return `${userName} removed ${activity.asset?.title || 'an asset'} from ${activity.collection?.name || 'a collection'}`
    case 'ASSET_SUBMITTED_FOR_REVIEW':
      return `${userName} submitted ${activity.asset?.title || 'an asset'} for review`
    case 'ASSET_APPROVED':
      return `${userName} approved ${activity.asset?.title || 'an asset'}`
    case 'ASSET_REJECTED':
      return `${userName} rejected ${activity.asset?.title || 'an asset'}`
    case 'CHANGES_REQUESTED':
      return `${userName} requested changes for ${activity.asset?.title || 'an asset'}`
    case 'SHARE_LINK_REVOKED':
      return `${userName} revoked share link for ${activity.asset?.title || 'an asset'}`
    case 'USER_LOGIN':
      return `${userName} logged in`
    case 'USER_LOGOUT':
      return `${userName} logged out`
    default:
      return activity.description || `${userName} performed an action`
  }
}

// Helper function to get activity statistics
async function getActivityStats(where: any) {
  const [
    totalByType,
    recentAssets,
    activeUsers
  ] = await Promise.all([
    // Activity count by type
    prisma.activity.groupBy({
      by: ['type'],
      where,
      _count: true
    }),
    // Recently accessed assets
    prisma.activity.findMany({
      where: {
        ...where,
        assetId: { not: null },
        type: { in: ['ASSET_VIEWED', 'ASSET_DOWNLOADED'] }
      },
      select: {
        assetId: true,
        asset: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      distinct: ['assetId'],
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    // Most active users
    prisma.activity.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 5
    })
  ])

  // Get user details for active users
  const userIds = activeUsers.map(u => u.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true
    }
  })

  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    byType: totalByType.map(item => ({
      type: item.type,
      count: item._count
    })),
    recentAssets: recentAssets.filter(a => a.asset).map(a => a.asset!),
    topUsers: activeUsers.map(item => ({
      user: userMap.get(item.userId),
      activityCount: item._count
    }))
  }
}