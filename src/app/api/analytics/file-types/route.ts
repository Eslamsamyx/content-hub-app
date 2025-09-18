import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { AnalyticsService } from '@/lib/analytics-service'

// GET /api/analytics/file-types - Distribution by file type
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permissions
    if (!hasPermission(user!, 'analytics.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get file type distribution
    const distribution = await AnalyticsService.getFileTypeDistribution()

    // Calculate totals
    const totals = distribution.reduce(
      (acc, item) => ({
        count: acc.count + item.count,
        size: acc.size + Number(item.totalSize)
      }),
      { count: 0, size: 0 }
    )

    // Format and add percentages
    const formattedDistribution = distribution.map(item => ({
      type: item.type,
      count: item.count,
      totalSize: item.totalSize.toString(),
      totalSizeGB: (Number(item.totalSize) / (1024 * 1024 * 1024)).toFixed(2),
      avgSize: item.avgSize.toString(),
      avgSizeMB: (Number(item.avgSize) / (1024 * 1024)).toFixed(2),
      percentages: {
        count: totals.count > 0
          ? ((item.count / totals.count) * 100).toFixed(1)
          : '0',
        size: totals.size > 0
          ? ((Number(item.totalSize) / totals.size) * 100).toFixed(1)
          : '0'
      }
    }))

    // Sort by total size descending
    formattedDistribution.sort((a, b) => 
      Number(b.totalSize) - Number(a.totalSize)
    )

    // Add human-readable type names
    const typeLabels: Record<string, string> = {
      IMAGE: 'Images',
      VIDEO: 'Videos',
      DOCUMENT: 'Documents',
      AUDIO: 'Audio Files',
      MODEL_3D: '3D Models',
      DESIGN: 'Design Files',
      OTHER: 'Other'
    }

    const distributionWithLabels = formattedDistribution.map(item => ({
      ...item,
      typeLabel: typeLabels[item.type] || item.type
    }))

    return successResponse({
      distribution: distributionWithLabels,
      summary: {
        totalTypes: distributionWithLabels.length,
        totalFiles: totals.count,
        totalSizeGB: (totals.size / (1024 * 1024 * 1024)).toFixed(2),
        avgFileSizeMB: totals.count > 0
          ? (totals.size / totals.count / (1024 * 1024)).toFixed(2)
          : '0'
      }
    })
  } catch (error) {
    console.error('Get file types distribution error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch file types distribution')
  }
}