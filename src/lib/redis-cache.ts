import Redis from 'ioredis'

// Redis client for caching with error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('Redis connection failed after 3 retries')
      return null // Stop retrying
    }
    return Math.min(times * 50, 200)
  },
  enableOfflineQueue: false, // Don't queue commands when offline
})

interface CacheOptions {
  ttl?: number // Time to live in seconds
  key: string
}

/**
 * Generic cache wrapper for any async function
 */
export async function withCache<T>(
  fn: () => Promise<T>,
  options: CacheOptions
): Promise<T> {
  const { key, ttl = 3600 } = options // Default 1 hour TTL
  
  try {
    // Try to get from cache
    const cached = await redis.get(key)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('Cache get error:', error)
    // Continue to fetch fresh data on cache error
  }
  
  // Fetch fresh data
  const data = await fn()
  
  // Store in cache (fire and forget)
  try {
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.error('Cache set error:', error)
    // Don't fail the request if caching fails
  }
  
  return data
}

/**
 * Cache invalidation helper
 */
export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

/**
 * Asset metadata cache helpers
 */
export const assetCache = {
  /**
   * Get cache key for asset
   */
  getKey(assetId: string): string {
    return `asset:${assetId}`
  },
  
  /**
   * Get cache key for asset list
   */
  getListKey(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(':')
    return `assets:list:${sortedParams}`
  },
  
  /**
   * Cache asset metadata
   */
  async set(assetId: string, data: any, ttl = 3600): Promise<void> {
    try {
      await redis.setex(assetCache.getKey(assetId), ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Asset cache set error:', error)
    }
  },
  
  /**
   * Get cached asset metadata
   */
  async get(assetId: string): Promise<any | null> {
    try {
      const cached = await redis.get(assetCache.getKey(assetId))
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Asset cache get error:', error)
      return null
    }
  },
  
  /**
   * Invalidate asset cache
   */
  async invalidate(assetId: string): Promise<void> {
    try {
      await redis.del(assetCache.getKey(assetId))
      // Also invalidate any list caches that might contain this asset
      await invalidateCache('assets:list:*')
    } catch (error) {
      console.error('Asset cache invalidation error:', error)
    }
  },
  
  /**
   * Batch get assets from cache
   */
  async batchGet(assetIds: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>()
    
    if (assetIds.length === 0) return result
    
    try {
      const keys = assetIds.map(id => assetCache.getKey(id))
      const values = await redis.mget(...keys)
      
      assetIds.forEach((id, index) => {
        const value = values[index]
        if (value) {
          result.set(id, JSON.parse(value))
        }
      })
    } catch (error) {
      console.error('Asset batch cache get error:', error)
    }
    
    return result
  }
}

/**
 * Search results cache helpers
 */
export const searchCache = {
  /**
   * Get cache key for search query
   */
  getKey(query: string, filters: Record<string, any>): string {
    const filterStr = Object.keys(filters)
      .sort()
      .map(k => `${k}:${filters[k]}`)
      .join(':')
    return `search:${query}:${filterStr}`
  },
  
  /**
   * Cache search results
   */
  async set(query: string, filters: Record<string, any>, data: any, ttl = 300): Promise<void> {
    try {
      await redis.setex(searchCache.getKey(query, filters), ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Search cache set error:', error)
    }
  },
  
  /**
   * Get cached search results
   */
  async get(query: string, filters: Record<string, any>): Promise<any | null> {
    try {
      const cached = await redis.get(searchCache.getKey(query, filters))
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Search cache get error:', error)
      return null
    }
  }
}

/**
 * Category stats cache helpers
 */
export const statsCache = {
  /**
   * Cache category statistics
   */
  async set(data: any, ttl = 600): Promise<void> {
    try {
      await redis.setex('stats:categories', ttl, JSON.stringify(data))
    } catch (error) {
      console.error('Stats cache set error:', error)
    }
  },
  
  /**
   * Get cached category statistics
   */
  async get(): Promise<any | null> {
    try {
      const cached = await redis.get('stats:categories')
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Stats cache get error:', error)
      return null
    }
  },
  
  /**
   * Invalidate stats cache
   */
  async invalidate(): Promise<void> {
    try {
      await redis.del('stats:categories')
    } catch (error) {
      console.error('Stats cache invalidation error:', error)
    }
  }
}

export default redis