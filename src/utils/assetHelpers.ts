/**
 * Asset helper utilities for handling fallback images and asset URLs
 */

// Default fallback images stored in public directory
export const DEFAULT_IMAGES = {
  avatar: '/images/default-avatar.svg',
  thumbnail: {
    default: '/images/default-thumbnail.svg',
    image: '/images/default-thumbnail.svg',
    video: '/images/default-thumbnail.svg',
    document: '/images/default-thumbnail.svg',
    audio: '/images/default-thumbnail.svg',
    '2d': '/images/default-thumbnail.svg',
    '3d': '/images/default-thumbnail.svg',
  },
  collection: '/images/default-thumbnail.svg',
  cover: '/images/default-thumbnail.svg',
  large: '/images/default-thumbnail.svg',
  small: '/images/default-avatar.svg',
} as const

/**
 * Get appropriate fallback image for asset type
 */
export function getFallbackImage(
  type: 'avatar' | 'thumbnail' | 'collection' | 'cover' | 'large' | 'small',
  subType?: string
): string {
  // For thumbnails, check subtype
  if (type === 'thumbnail' && subType) {
    const thumbnailType = subType.toLowerCase()
    return DEFAULT_IMAGES.thumbnail[thumbnailType as keyof typeof DEFAULT_IMAGES.thumbnail] || DEFAULT_IMAGES.thumbnail.default
  }
  
  // Return appropriate default image
  const image = DEFAULT_IMAGES[type as keyof typeof DEFAULT_IMAGES]
  if (typeof image === 'string') {
    return image
  }
  
  return DEFAULT_IMAGES.thumbnail.default
}

/**
 * Get asset thumbnail URL with fallback
 */
export function getAssetThumbnail(
  thumbnailUrl?: string | null,
  assetType?: string
): string {
  if (thumbnailUrl) {
    return thumbnailUrl
  }
  
  // Return type-specific fallback
  return getFallbackImage('thumbnail', assetType)
}

/**
 * Get user avatar URL with fallback
 */
export function getUserAvatar(
  avatarUrl?: string | null,
  userName?: string
): string {
  if (avatarUrl) {
    return avatarUrl
  }
  
  // Could generate avatar from initials if userName provided
  if (userName) {
    // Using UI Avatars service as fallback (free service)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6366f1&color=fff&size=100`
  }
  
  return DEFAULT_IMAGES.avatar
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | string | bigint): string {
  let size: number
  
  if (typeof bytes === 'string') {
    size = parseInt(bytes, 10)
  } else if (typeof bytes === 'bigint') {
    size = Number(bytes)
  } else {
    size = bytes
  }
  
  if (isNaN(size) || size === 0) {
    return '0 B'
  }
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let formattedSize = size
  
  while (formattedSize >= 1024 && unitIndex < units.length - 1) {
    formattedSize /= 1024
    unitIndex++
  }
  
  return `${formattedSize.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Get asset type icon
 */
export function getAssetTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    document: '📄',
    '2d': '🎨',
    '3d': '📦',
    archive: '📁'
  }
  
  return icons[type.toLowerCase()] || '📄'
}

/**
 * Check if URL is external
 */
export function isExternalUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return !urlObj.hostname.includes(window.location.hostname)
  } catch {
    return false
  }
}

/**
 * Generate share URL for asset
 */
export function getAssetShareUrl(assetId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/share/asset/${assetId}`
}

/**
 * Generate collection share URL
 */
export function getCollectionShareUrl(collectionId: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/share/collection/${collectionId}`
}