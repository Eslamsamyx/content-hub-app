import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { SystemMonitoringService } from '@/lib/system-monitoring-service'

// GET /api/system/metrics - System metrics (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'view_system_metrics')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get system metrics
    const metrics = await SystemMonitoringService.getSystemMetrics()

    // Format response
    return successResponse({
      timestamp: new Date(),
      metrics: {
        server: {
          uptime: {
            seconds: metrics.server.uptime,
            formatted: formatUptime(metrics.server.uptime)
          },
          memory: {
            // Server memory usage
            used: metrics.server.memory.used,
            total: metrics.server.memory.total,
            free: metrics.server.memory.free,
            percentUsed: Number(metrics.server.memory.percentUsed.toFixed(1)),
            // MB values
            usedMB: (metrics.server.memory.used / (1024 * 1024)).toFixed(2),
            totalMB: (metrics.server.memory.total / (1024 * 1024)).toFixed(2),
            freeMB: (metrics.server.memory.free / (1024 * 1024)).toFixed(2),
            // GB values for backward compatibility
            totalGB: (metrics.server.memory.total / (1024 * 1024 * 1024)).toFixed(3),
            usedGB: (metrics.server.memory.used / (1024 * 1024 * 1024)).toFixed(3),
            freeGB: (metrics.server.memory.free / (1024 * 1024 * 1024)).toFixed(3)
          },
          cpu: {
            loadAverage: {
              '1min': metrics.server.cpu.loadAverage[0]?.toFixed(2),
              '5min': metrics.server.cpu.loadAverage[1]?.toFixed(2),
              '15min': metrics.server.cpu.loadAverage[2]?.toFixed(2)
            },
            cores: metrics.server.cpu.cores
          }
        },
        database: {
          ...metrics.database,
          latencyMs: metrics.database.queryLatency,
          status: metrics.database.queryLatency < 100 ? 'healthy' : 
                  metrics.database.queryLatency < 500 ? 'slow' : 'critical'
        },
        storage: {
          totalUsed: metrics.storage.totalUsed.toString(),
          totalUsedGB: (Number(metrics.storage.totalUsed) / (1024 * 1024 * 1024)).toFixed(2),
          assetCount: metrics.storage.assetCount,
          averageFileSize: metrics.storage.averageFileSize.toString(),
          averageFileSizeMB: (Number(metrics.storage.averageFileSize) / (1024 * 1024)).toFixed(2),
          largestFiles: metrics.storage.largestFiles
        },
        activity: {
          ...metrics.activity,
          errorRatePercent: (metrics.activity.errorRate * 100).toFixed(2)
        }
      }
    })
  } catch (error) {
    console.error('Get system metrics error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch system metrics')
  }
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}