export const placeholderImages = {
  // Avatar placeholders
  avatar: '/api/placeholder/100/100',
  
  // Thumbnail placeholders by type
  thumbnail: {
    default: '/api/placeholder/400/225',
    image: '/api/placeholder/400/225',
    video: '/api/placeholder/400/225',
    document: '/api/placeholder/400/225',
    audio: '/api/placeholder/400/225',
    '2d': '/api/placeholder/400/225',
    '3d': '/api/placeholder/400/225',
  },
  
  // Collection thumbnails
  collection: '/api/placeholder/400/300',
  
  // Cover images
  cover: '/api/placeholder/1600/400',
  
  // Asset details
  large: '/api/placeholder/1200/800',
  
  // Small thumbnails for activity
  small: '/api/placeholder/100/100',
}

export function getPlaceholderImage(type: 'avatar' | 'thumbnail' | 'collection' | 'cover' | 'large' | 'small', subType?: string): string {
  if (type === 'thumbnail' && subType) {
    return placeholderImages.thumbnail[subType as keyof typeof placeholderImages.thumbnail] || placeholderImages.thumbnail.default
  }
  
  const image = placeholderImages[type as keyof typeof placeholderImages]
  if (typeof image === 'string') {
    return image
  }
  
  return placeholderImages.thumbnail.default
}