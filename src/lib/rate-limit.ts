import { NextRequest } from 'next/server'
import Redis from 'ioredis'

// Initialize Redis client for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
})

interface RateLimitOptions {
  uniqueTokenPerInterval?: number
  interval?: number
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { 
    uniqueTokenPerInterval = 10, // 10 requests
    interval = 60000 // per minute
  } = options

  // Skip rate limiting in test/development environment if explicitly disabled
  if (process.env.DISABLE_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'test') {
    return {
      success: true,
      limit: uniqueTokenPerInterval,
      remaining: uniqueTokenPerInterval,
      reset: Date.now() + interval
    }
  }

  try {
    // Get identifier from IP headers
    const identifier = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      request.headers.get('x-client-ip') ||
      'anonymous'
    
    const key = `rate_limit:${identifier}:${request.nextUrl.pathname}`
    const reset = Date.now() + interval
    
    // Check if Redis is available
    const ping = await redis.ping().catch(() => null)
    if (!ping) {
      console.warn('Redis not available for rate limiting, allowing request')
      return {
        success: true,
        limit: uniqueTokenPerInterval,
        remaining: uniqueTokenPerInterval,
        reset
      }
    }
    
    // Use Redis to track requests
    const pipeline = redis.pipeline()
    pipeline.incr(key)
    pipeline.expire(key, Math.ceil(interval / 1000))
    const results = await pipeline.exec()
    
    if (!results) {
      throw new Error('Redis pipeline failed')
    }
    
    const count = results[0][1] as number
    const remaining = Math.max(0, uniqueTokenPerInterval - count)
    
    return {
      success: count <= uniqueTokenPerInterval,
      limit: uniqueTokenPerInterval,
      remaining,
      reset
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      limit: uniqueTokenPerInterval,
      remaining: uniqueTokenPerInterval,
      reset: Date.now() + interval
    }
  }
}

// Middleware helper for common rate limit scenarios
export const rateLimitPresets = {
  // Strict rate limit for auth endpoints
  auth: {
    uniqueTokenPerInterval: 5,
    interval: 60000 // 5 requests per minute
  },
  // Standard API rate limit
  api: {
    uniqueTokenPerInterval: 100,
    interval: 60000 // 100 requests per minute
  },
  // Relaxed rate limit for search
  search: {
    uniqueTokenPerInterval: 30,
    interval: 60000 // 30 searches per minute
  },
  // Upload rate limit
  upload: {
    uniqueTokenPerInterval: 10,
    interval: 300000 // 10 uploads per 5 minutes
  }
}