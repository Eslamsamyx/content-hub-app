import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from './s3'

interface S3UrlRequest {
  key: string
  type: 'download' | 'view'
}

interface S3UrlResult {
  key: string
  url: string
  expiresAt: Date
}

/**
 * Generate S3 URLs in batch to reduce API calls and improve performance
 * This solves the N+1 query problem when fetching multiple assets
 */
export async function getBatchS3Urls(
  requests: S3UrlRequest[],
  expiresIn: number = 3600 // 1 hour default
): Promise<Map<string, S3UrlResult>> {
  if (!requests || requests.length === 0) {
    return new Map()
  }

  const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET
  if (!bucket) {
    throw new Error('S3 bucket not configured')
  }

  // Process all URL generation in parallel
  const urlPromises = requests.map(async ({ key, type }) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: type === 'download' 
          ? `attachment; filename="${key.split('/').pop()}"` 
          : 'inline'
      })

      const url = await getSignedUrl(s3Client, command, { expiresIn })
      const expiresAt = new Date(Date.now() + expiresIn * 1000)

      return {
        key,
        result: {
          key,
          url,
          expiresAt
        }
      }
    } catch (error) {
      console.error(`Failed to generate URL for key: ${key}`, error)
      // Return null for failed URLs
      return {
        key,
        result: null
      }
    }
  })

  const results = await Promise.all(urlPromises)
  
  // Convert to Map for efficient lookups
  const urlMap = new Map<string, S3UrlResult>()
  
  for (const { key, result } of results) {
    if (result) {
      urlMap.set(key, result)
    }
  }

  return urlMap
}

/**
 * Helper function to add S3 URLs to asset objects
 */
export async function enrichAssetsWithUrls<T extends { fileKey?: string | null, thumbnailKey?: string | null }>(
  assets: T[],
  includeTypes: ('file' | 'thumbnail')[] = ['thumbnail']
): Promise<(T & { urls?: { file?: string, thumbnail?: string } })[]> {
  // Collect all unique keys that need URLs
  const urlRequests: S3UrlRequest[] = []
  
  for (const asset of assets) {
    if (includeTypes.includes('file') && asset.fileKey) {
      urlRequests.push({ key: asset.fileKey, type: 'view' })
    }
    if (includeTypes.includes('thumbnail') && asset.thumbnailKey) {
      urlRequests.push({ key: asset.thumbnailKey, type: 'view' })
    }
  }

  // Get all URLs in batch
  const urlMap = await getBatchS3Urls(urlRequests)

  // Enrich assets with URLs
  return assets.map(asset => {
    const urls: { file?: string, thumbnail?: string } = {}
    
    if (asset.fileKey && urlMap.has(asset.fileKey)) {
      urls.file = urlMap.get(asset.fileKey)!.url
    }
    if (asset.thumbnailKey && urlMap.has(asset.thumbnailKey)) {
      urls.thumbnail = urlMap.get(asset.thumbnailKey)!.url
    }

    return {
      ...asset,
      urls: Object.keys(urls).length > 0 ? urls : undefined
    }
  })
}

/**
 * Cache for frequently accessed S3 URLs (in-memory for now)
 * In production, this should use Redis
 */
class S3UrlCache {
  private cache = new Map<string, { url: string, expiresAt: Date }>()
  
  get(key: string): string | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Check if expired
    if (cached.expiresAt < new Date()) {
      this.cache.delete(key)
      return null
    }
    
    return cached.url
  }
  
  set(key: string, url: string, expiresAt: Date): void {
    this.cache.set(key, { url, expiresAt })
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 1000) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries())
      entries.slice(0, 100).forEach(([k]) => this.cache.delete(k))
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
}

export const s3UrlCache = new S3UrlCache()