import { prisma } from '@/lib/prisma'
import os from 'os'
import { promises as fs } from 'fs'
import path from 'path'

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: HealthCheck
    storage: HealthCheck
    redis: HealthCheck
    fileSystem: HealthCheck
    cdn?: HealthCheck
  }
  timestamp: Date
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message: string
  latency?: number
  details?: any
}

export interface SystemMetrics {
  server: {
    uptime: number
    memory: {
      total: number
      used: number
      free: number
      percentUsed: number
    }
    cpu: {
      loadAverage: number[]
      cores: number
    }
  }
  database: {
    connectionCount: number
    queryLatency: number
    tableStats: any[]
  }
  storage: {
    totalUsed: bigint
    assetCount: number
    averageFileSize: bigint
    largestFiles: any[]
  }
  activity: {
    activeUsers: number
    requestsPerMinute: number
    errorRate: number
  }
}

export interface SystemLogs {
  errors: ErrorLog[]
  warnings: WarningLog[]
  info: InfoLog[]
}

interface ErrorLog {
  id: string
  timestamp: Date
  message: string
  stack?: string
  context?: any
}

interface WarningLog {
  id: string
  timestamp: Date
  message: string
  context?: any
}

interface InfoLog {
  id: string
  timestamp: Date
  message: string
  context?: any
}

export class SystemMonitoringService {
  private static requestCounts = new Map<string, number>()
  private static errorCounts = new Map<string, number>()
  private static lastReset = Date.now()

  /**
   * Get overall system health status
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkRedis(),
      this.checkFileSystem(),
      this.checkCDN()
    ])

    const [database, storage, redis, fileSystem, cdn] = checks

    // Determine overall status
    const statuses = checks.filter(c => c !== undefined).map(c => c.status)
    let overallStatus: SystemHealth['status'] = 'healthy'
    
    if (statuses.includes('unhealthy')) {
      overallStatus = 'unhealthy'
    } else if (statuses.includes('degraded')) {
      overallStatus = 'degraded'
    }

    return {
      status: overallStatus,
      checks: {
        database,
        storage,
        redis,
        fileSystem,
        cdn
      },
      timestamp: new Date()
    }
  }

  /**
   * Get comprehensive system metrics
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    const [
      dbStats,
      storageStats,
      activityStats
    ] = await Promise.all([
      this.getDatabaseStats(),
      this.getStorageStats(),
      this.getActivityStats()
    ])

    // Get process memory usage
    const processMemory = process.memoryUsage()
    // const systemMemory = {
    //   total: os.totalmem(),
    //   free: os.freemem()
    // }

    return {
      server: {
        uptime: process.uptime(),
        memory: {
          // Simplified memory values for API compatibility
          total: processMemory.heapTotal,
          used: processMemory.heapUsed,
          free: processMemory.heapTotal - processMemory.heapUsed,
          percentUsed: (processMemory.heapUsed / processMemory.heapTotal) * 100
        },
        cpu: {
          loadAverage: os.loadavg(),
          cores: os.cpus().length
        }
      },
      database: dbStats,
      storage: storageStats,
      activity: activityStats
    }
  }

  /**
   * Track request for monitoring
   */
  static trackRequest(endpoint: string, statusCode: number) {
    const minute = Math.floor(Date.now() / 60000).toString()
    const key = `${minute}:${endpoint}`
    
    this.requestCounts.set(key, (this.requestCounts.get(key) || 0) + 1)

    if (statusCode >= 400) {
      const errorKey = `${minute}:errors`
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1)
    }

    // Clean up old entries (older than 5 minutes)
    this.cleanupOldMetrics()
  }

  /**
   * Get request metrics
   */
  static getRequestMetrics() {
    const currentMinute = Math.floor(Date.now() / 60000)
    const lastMinuteKey = `${currentMinute - 1}:`
    
    let requestsLastMinute = 0
    let errorsLastMinute = 0

    for (const [key, count] of this.requestCounts) {
      if (key.startsWith(lastMinuteKey)) {
        requestsLastMinute += count
      }
    }

    const errorKey = `${currentMinute - 1}:errors`
    errorsLastMinute = this.errorCounts.get(errorKey) || 0

    return {
      requestsPerMinute: requestsLastMinute,
      errorRate: requestsLastMinute > 0 ? (errorsLastMinute / requestsLastMinute) : 0
    }
  }

  // Private helper methods

  private static async checkDatabase(): Promise<HealthCheck> {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - start

      if (latency > 1000) {
        return {
          status: 'degraded',
          message: 'Database response time is slow',
          latency
        }
      }

      return {
        status: 'healthy',
        message: 'Database is responding normally',
        latency
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database connection failed',
        details: error
      }
    }
  }

  private static async checkStorage(): Promise<HealthCheck> {
    try {
      // Import S3 service to check actual configuration
      const { s3Service } = await import('./s3-enhanced')
      const status = s3Service.getStatus()

      // Check if S3 is properly configured
      if (!status.isConfigured) {
        // Check for placeholder values that indicate unconfigured state
        const hasPlaceholders = 
          status.config.accessKeyId === 'your_access_key_here' ||
          status.config.secretAccessKey === 'your_secret_key_here' ||
          !status.config.bucket ||
          status.config.bucket === 'your-bucket-name'

        if (hasPlaceholders) {
          return {
            status: 'degraded',
            message: 'S3 storage has placeholder configuration',
            details: { 
              configured: false,
              reason: 'Placeholder values detected in configuration'
            }
          }
        }

        return {
          status: 'degraded',
          message: 'S3 storage not properly configured',
          details: { 
            configured: false,
            enabled: status.config.enabled,
            hasCredentials: !!(status.config.accessKeyId && status.config.secretAccessKey),
            hasBucket: !!status.config.bucket
          }
        }
      }

      // If configured, try to test connectivity
      try {
        // Test S3 connectivity with a simple operation
        const testResult = await s3Service.testConnection()
        
        if (testResult.success) {
          return {
            status: 'healthy',
            message: 'S3 storage is operational',
            details: {
              configured: true,
              bucket: status.config.bucket,
              region: status.config.region,
              metrics: status.metrics
            }
          }
        } else {
          return {
            status: 'unhealthy',
            message: testResult.error || 'S3 connection test failed',
            details: {
              configured: true,
              error: testResult.error,
              bucket: status.config.bucket
            }
          }
        }
      } catch (connError: any) {
        return {
          status: 'unhealthy',
          message: 'S3 connectivity check failed',
          details: {
            configured: true,
            error: connError.message,
            bucket: status.config.bucket
          }
        }
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: 'Storage check failed',
        details: { 
          error: error.message || 'Unknown error'
        }
      }
    }
  }

  private static async checkRedis(): Promise<HealthCheck> {
    try {
      // Check if Redis configuration exists
      const hasRedisConfig = !!(
        process.env.REDIS_HOST &&
        process.env.REDIS_PORT
      )

      if (!hasRedisConfig) {
        return {
          status: 'degraded',
          message: 'Redis not configured for job queues',
          details: { configured: false }
        }
      }

      // In production, you would actually ping Redis
      return {
        status: 'healthy',
        message: 'Redis configuration is valid'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Redis check failed',
        details: error
      }
    }
  }

  private static async checkCDN(): Promise<HealthCheck> {
    try {
      const cdnUrl = process.env.CDN_URL || process.env.NEXT_PUBLIC_CDN_URL
      
      if (!cdnUrl) {
        // No CDN configured, which is okay for development
        return {
          status: 'healthy',
          message: 'CDN not configured (using direct S3)',
          details: { configured: false }
        }
      }

      // Perform a HEAD request to CDN health check endpoint
      const startTime = Date.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`${cdnUrl}/health.txt`, {
          method: 'HEAD',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        const latency = Date.now() - startTime

        if (response.ok) {
          return {
            status: 'healthy',
            message: 'CDN is responsive',
            latency,
            details: { 
              url: cdnUrl,
              statusCode: response.status,
              latency: `${latency}ms`
            }
          }
        } else if (response.status >= 500) {
          return {
            status: 'unhealthy',
            message: `CDN returned error ${response.status}`,
            latency,
            details: { 
              url: cdnUrl,
              statusCode: response.status
            }
          }
        } else {
          return {
            status: 'degraded',
            message: `CDN returned status ${response.status}`,
            latency,
            details: { 
              url: cdnUrl,
              statusCode: response.status
            }
          }
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          return {
            status: 'unhealthy',
            message: 'CDN health check timed out',
            details: { 
              url: cdnUrl,
              timeout: '5000ms'
            }
          }
        }
        
        return {
          status: 'degraded',
          message: 'CDN health check failed',
          details: { 
            url: cdnUrl,
            error: fetchError.message
          }
        }
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: 'CDN check failed',
        details: { error: error.message }
      }
    }
  }

  private static async checkFileSystem(): Promise<HealthCheck> {
    try {
      // Check temp directory is writable
      const tempDir = os.tmpdir()
      const testFile = path.join(tempDir, 'health-check.txt')
      
      await fs.writeFile(testFile, 'health check')
      await fs.unlink(testFile)

      return {
        status: 'healthy',
        message: 'File system is writable'
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'File system write test failed',
        details: error
      }
    }
  }

  private static async getDatabaseStats() {
    try {
      // Get connection count (simplified - in production use pg_stat_activity)
      const [tableStats, queryTiming] = await Promise.all([
        // Table statistics
        prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size('"' || schemaname || '"."' || tablename || '"')) as size
          FROM pg_tables
          WHERE schemaname = 'public'
          ORDER BY pg_total_relation_size('"' || schemaname || '"."' || tablename || '"') DESC
          LIMIT 10
        `,
        // Simple query performance check
        (async () => {
          const start = Date.now()
          await prisma.user.count()
          return Date.now() - start
        })()
      ])

      return {
        connectionCount: 1, // Simplified
        queryLatency: queryTiming,
        tableStats: tableStats as any[]
      }
    } catch (error) {
      console.error('Database stats error:', error)
      return {
        connectionCount: 0,
        queryLatency: 0,
        tableStats: []
      }
    }
  }

  private static async getStorageStats() {
    const [totalStorage, assetCount, largestFiles] = await Promise.all([
      prisma.asset.aggregate({
        _sum: { fileSize: true },
        _avg: { fileSize: true },
        _count: true
      }),
      prisma.asset.count(),
      prisma.asset.findMany({
        orderBy: { fileSize: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          fileSize: true,
          type: true,
          uploadedBy: {
            select: {
            firstName: true,
              email: true
            }
          }
        }
      })
    ])

    return {
      totalUsed: totalStorage._sum.fileSize || BigInt(0),
      assetCount,
      averageFileSize: BigInt(Math.round(totalStorage._avg.fileSize || 0)),
      largestFiles: largestFiles.map(f => ({
        ...f,
        fileSize: f.fileSize.toString(),
        fileSizeMB: (Number(f.fileSize) / (1024 * 1024)).toFixed(2)
      }))
    }
  }

  private static async getActivityStats() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    const activeUsers = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: fiveMinutesAgo }
      },
      _count: true
    })

    const metrics = this.getRequestMetrics()

    return {
      activeUsers: activeUsers.length,
      requestsPerMinute: metrics.requestsPerMinute,
      errorRate: metrics.errorRate
    }
  }

  private static cleanupOldMetrics() {
    const fiveMinutesAgo = Math.floor((Date.now() - 5 * 60000) / 60000)
    
    for (const key of this.requestCounts.keys()) {
      const minute = parseInt(key.split(':')[0])
      if (minute < fiveMinutesAgo) {
        this.requestCounts.delete(key)
      }
    }

    for (const key of this.errorCounts.keys()) {
      const minute = parseInt(key.split(':')[0])
      if (minute < fiveMinutesAgo) {
        this.errorCounts.delete(key)
      }
    }
  }

  /**
   * Log system event
   */
  static async logEvent(
    level: 'error' | 'warning' | 'info',
    message: string,
    context?: any
  ) {
    // In production, this would write to a logging service
    // For now, we'll just console log with structure
    const log = {
      id: Date.now().toString(),
      timestamp: new Date(),
      level,
      message,
      context
    }

    switch (level) {
      case 'error':
        console.error('[SYSTEM ERROR]', log)
        break
      case 'warning':
        console.warn('[SYSTEM WARNING]', log)
        break
      case 'info':
        console.info('[SYSTEM INFO]', log)
        break
    }

    return log
  }
}