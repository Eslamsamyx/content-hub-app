import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

// GET /api/profile/activity - Get user's activity history
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const type = searchParams.get('type') as ActivityType | undefined
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause
    const where: any = {
      userId: user!.id,
      ...(type && { type }),
      ...(dateFrom || dateTo ? {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      } : {}),
    }

    // Execute queries in parallel
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          asset: {
            select: {
              id: true,
              title: true,
              type: true,
              thumbnailKey: true,
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ])

    // Group activities by date
    const groupedActivities = activities.reduce((acc, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        asset: activity.asset,
        collection: activity.collection,
      })
      return acc
    }, {} as Record<string, any[]>)

    // Get activity summary
    const summary = await prisma.activity.groupBy({
      by: ['type'],
      where: { userId: user!.id },
      _count: true,
    })

    return successResponse(
      {
        activities: groupedActivities,
        summary: summary.reduce((acc, item) => {
          acc[item.type] = item._count
          return acc
        }, {} as Record<string, number>),
      },
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    )
  } catch (error) {
    console.error('Get user activity error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch activity')
  }
}