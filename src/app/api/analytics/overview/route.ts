import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { AnalyticsService } from '@/lib/analytics-service'
import { prisma } from '@/lib/prisma'

// GET /api/analytics/overview - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permissions - analytics available to content managers and above
    if (!hasPermission(user!, 'analytics.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get dashboard metrics
    const metrics = await AnalyticsService.getDashboardMetrics()

    // Calculate additional derived metrics
    const storageUsedGB = Number(metrics.storageUsed) / (1024 * 1024 * 1024)
    const avgAssetSize = metrics.totalAssets > 0 
      ? Number(metrics.storageUsed) / metrics.totalAssets 
      : 0

    // Get comparison with previous period (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const [currentPeriodUploads, previousPeriodUploads] = await Promise.all([
      prisma.asset.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.asset.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ])

    const uploadGrowth = previousPeriodUploads > 0
      ? ((currentPeriodUploads - previousPeriodUploads) / previousPeriodUploads) * 100
      : 100

    return successResponse({
      metrics: {
        totalAssets: metrics.totalAssets,
        activeAssets: metrics.activeAssets,
        totalViews: metrics.totalViews,
        totalDownloads: metrics.totalDownloads,
        totalShares: metrics.totalShares,
        activeUsers: metrics.activeUsers,
        storageUsed: metrics.storageUsed.toString(),
        storageUsedGB: storageUsedGB.toFixed(2),
        avgAssetSizeMB: (avgAssetSize / (1024 * 1024)).toFixed(2),
        recentUploads: metrics.recentUploads
      },
      growth: {
        uploads: {
          current: currentPeriodUploads,
          previous: previousPeriodUploads,
          percentChange: uploadGrowth.toFixed(1)
        }
      },
      summary: {
        assetUtilization: metrics.totalAssets > 0 
          ? ((metrics.totalDownloads / metrics.totalAssets) * 100).toFixed(1)
          : '0',
        activeAssetPercentage: metrics.totalAssets > 0
          ? ((metrics.activeAssets / metrics.totalAssets) * 100).toFixed(1)
          : '0'
      }
    })
  } catch (error) {
    console.error('Get analytics overview error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch analytics overview')
  }
}