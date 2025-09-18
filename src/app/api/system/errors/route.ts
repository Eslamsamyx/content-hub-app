import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// GET /api/system/errors - Recent system errors (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'view_system_metrics')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))

    const since = new Date(Date.now() - hours * 60 * 60 * 1000)

    // Get failed processing jobs
    const [
      failedAssets,
      failedReviews,
      errorPatterns
    ] = await Promise.all([
      // Failed asset processing
      prisma.asset.findMany({
        where: {
          processingStatus: 'FAILED',
          updatedAt: { gte: since }
        },
        select: {
          id: true,
          title: true,
          type: true,
          processingError: true,
          updatedAt: true,
          uploadedBy: {
            select: {
            firstName: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      }),

      // Failed reviews
      prisma.review.findMany({
        where: {
          status: 'REJECTED',
          updatedAt: { gte: since }
        },
        select: {
          id: true,
          comments: true,
          updatedAt: true,
          asset: {
            select: {
              id: true,
              title: true
            }
          },
          reviewer: {
            select: {
            firstName: true,
              email: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: Math.floor(limit / 2)
      }),

      // Error patterns (grouped by error message)
      prisma.asset.groupBy({
        by: ['processingError'],
        where: {
          processingStatus: 'FAILED',
          processingError: { not: null },
          updatedAt: { gte: since }
        },
        _count: true
      })
    ])

    // Format error patterns
    const errorSummary = errorPatterns
      .filter(e => e.processingError)
      .map(e => ({
        error: e.processingError!,
        count: e._count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get activity errors (if tracking)
    // Note: For JSON fields in Prisma, we need to use proper JSON filtering
    // We'll fetch recent activities and filter for errors in memory
    const recentActivities = await prisma.activity.findMany({
      where: {
        createdAt: { gte: since }
      },
      select: {
        id: true,
        type: true,
        createdAt: true,
        metadata: true,
        user: {
          select: {
            firstName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    // Filter for activities with error metadata
    const activityErrors = recentActivities.filter(activity => {
      if (!activity.metadata || typeof activity.metadata !== 'object') return false
      const metadata = activity.metadata as any
      return metadata.error || metadata.errorMessage || metadata.failed === true
    }).slice(0, 20)

    return successResponse({
      period: `Last ${hours} hours`,
      summary: {
        totalErrors: failedAssets.length + activityErrors.length,
        failedAssets: failedAssets.length,
        failedReviews: failedReviews.length,
        activityErrors: activityErrors.length
      },
      errorPatterns: errorSummary,
      recentErrors: {
        assets: failedAssets.map(asset => ({
          id: asset.id,
          title: asset.title,
          type: asset.type,
          error: asset.processingError,
          timestamp: asset.updatedAt,
          user: asset.uploadedBy
        })),
        reviews: failedReviews.map(review => ({
          id: review.id,
          assetId: review.asset.id,
          assetTitle: review.asset.title,
          reason: review.comments,
          timestamp: review.updatedAt,
          reviewer: review.reviewer
        })),
        activities: activityErrors.map(activity => ({
          id: activity.id,
          type: activity.type,
          error: activity.metadata,
          timestamp: activity.createdAt,
          user: activity.user
        }))
      }
    })
  } catch (error) {
    console.error('Get system errors error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch system errors')
  }
}