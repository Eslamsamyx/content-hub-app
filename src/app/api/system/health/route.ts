import { SystemMonitoringService } from '@/lib/system-monitoring-service'

// GET /api/system/health - Public health check endpoint
export async function GET() {
  try {
    // Get system health (no auth required for health checks)
    const health = await SystemMonitoringService.getSystemHealth()

    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503

    return new Response(JSON.stringify({
      success: true,
      data: health
    }), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return new Response(JSON.stringify({
      success: false,
      data: {
        status: 'unhealthy',
        checks: {
          database: { status: 'unhealthy', message: 'Check failed' },
          storage: { status: 'unhealthy', message: 'Check failed' },
          redis: { status: 'unhealthy', message: 'Check failed' },
          fileSystem: { status: 'unhealthy', message: 'Check failed' }
        },
        timestamp: new Date()
      }
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}