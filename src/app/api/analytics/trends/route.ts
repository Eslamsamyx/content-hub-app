import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { AnalyticsService } from '@/lib/analytics-service'

// GET /api/analytics/trends - Time-based trends
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permissions
    if (!hasPermission(user!, 'analytics.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const metric = searchParams.get('metric') as 'views' | 'downloads' | 'uploads' | 'shares'
    const period = searchParams.get('period') || '30d'

    // Validate metric
    if (!metric || !['views', 'downloads', 'uploads', 'shares'].includes(metric)) {
      return ApiErrors.VALIDATION_ERROR('Invalid metric. Must be one of: views, downloads, uploads, shares')
    }

    // Validate period
    if (!['7d', '30d', '90d', '1y'].includes(period)) {
      return ApiErrors.VALIDATION_ERROR('Invalid period. Must be one of: 7d, 30d, 90d, 1y')
    }

    // Get trend data
    const trends = await AnalyticsService.getTrends(metric, period)

    // Calculate summary statistics
    const values = trends.map(t => t.value)
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = values.length > 0 ? total / values.length : 0
    const max = Math.max(...values, 0)
    const min = Math.min(...values, 0)

    // Get period configuration
    const periodConfig = AnalyticsService.PERIODS[period]

    return successResponse({
      metric,
      period: {
        key: period,
        label: periodConfig.label,
        days: periodConfig.days,
        groupBy: periodConfig.groupBy
      },
      data: trends,
      summary: {
        total,
        average: average.toFixed(2),
        max,
        min,
        dataPoints: trends.length
      }
    })
  } catch (error) {
    console.error('Get analytics trends error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch analytics trends')
  }
}