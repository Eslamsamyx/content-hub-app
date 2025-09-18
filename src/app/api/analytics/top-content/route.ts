import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { AnalyticsService } from '@/lib/analytics-service'
import { getDownloadUrl } from '@/lib/s3-enhanced'

// GET /api/analytics/top-content - Most popular assets
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
    const metric = searchParams.get('metric') as 'views' | 'downloads' | 'shares'
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10'))
    const period = searchParams.get('period') || 'all'

    // Validate metric
    if (!metric || !['views', 'downloads', 'shares'].includes(metric)) {
      return ApiErrors.VALIDATION_ERROR('Invalid metric. Must be one of: views, downloads, shares')
    }

    // Get top content
    const topContent = await AnalyticsService.getTopContent(metric, limit, period)

    // Generate thumbnail URLs
    const contentWithUrls = await Promise.all(
      topContent.map(async (item) => {
        let thumbnailUrl = null
        if (item.asset?.thumbnailKey) {
          thumbnailUrl = await getDownloadUrl(item.asset.thumbnailKey, undefined, 3600)
        }

        return {
          asset: item.asset ? {
            id: item.asset.id,
            title: item.asset.title,
            type: item.asset.type,
            fileSize: item.asset.fileSize.toString(),
            thumbnailUrl,
            uploadedBy: item.asset.uploadedBy
          } : null,
          count: item.count,
          metric
        }
      })
    )

    // Calculate total for percentage calculation
    const total = contentWithUrls.reduce((sum, item) => sum + item.count, 0)

    // Add percentage to each item
    const contentWithPercentage = contentWithUrls.map(item => ({
      ...item,
      percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
    }))

    return successResponse({
      metric,
      period: period === 'all' ? 'All time' : AnalyticsService.PERIODS[period]?.label || period,
      topContent: contentWithPercentage,
      total
    })
  } catch (error) {
    console.error('Get top content error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch top content')
  }
}