import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SystemMonitoringService } from './system-monitoring-service'

/**
 * Monitoring middleware to track API requests
 */
export function withMonitoring(handler: Function) {
  return async function (request: NextRequest, ...args: any[]) {
    const start = Date.now()
    const path = request.nextUrl.pathname

    try {
      // Execute the handler
      const response = await handler(request, ...args)
      
      // Track the request
      const duration = Date.now() - start
      const status = response.status || 200
      
      SystemMonitoringService.trackRequest(path, status)

      // Log slow requests
      if (duration > 1000) {
        await SystemMonitoringService.logEvent(
          'warning',
          'Slow API request detected',
          {
            path,
            duration,
            status,
            method: request.method
          }
        )
      }

      // Add monitoring headers
      if (response instanceof NextResponse) {
        response.headers.set('X-Response-Time', `${duration}ms`)
        response.headers.set('X-Request-ID', generateRequestId())
      }

      return response
    } catch (error) {
      // Track error
      const duration = Date.now() - start
      SystemMonitoringService.trackRequest(path, 500)

      // Log error
      await SystemMonitoringService.logEvent(
        'error',
        'API request failed',
        {
          path,
          duration,
          method: request.method,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : error
        }
      )

      throw error
    }
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Extract user ID from request (if authenticated)
 * @unused - Reserved for future JWT token verification
 */
// async function extractUserId(request: NextRequest): Promise<string | null> {
//   try {
//     const token = request.headers.get('authorization')?.replace('Bearer ', '')
//     if (!token) return null

//     // In production, verify and decode the JWT token
//     // For now, return null
//     return null
//   } catch {
//     return null
//   }
// }