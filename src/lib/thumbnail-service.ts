import sharp from 'sharp'
import { AssetType } from '@prisma/client'

// Thumbnail configuration based on actual UI usage
export const THUMBNAIL_SIZES = {
  // Main thumbnail for cards (aspect-video 16:9)
  thumbnail: { 
    width: 400, 
    height: 225,  // 16:9 aspect ratio
    quality: 80,
    fit: 'cover' as const
  },
  // Square thumbnail for related items
  square: { 
    width: 150, 
    height: 150,  // 1:1 aspect ratio
    quality: 75,
    fit: 'cover' as const
  },
  // Large preview for detail pages
  preview: { 
    width: 1200, 
    height: 675,  // 16:9 aspect ratio
    quality: 85,
    fit: 'inside' as const
  },
  // Mobile optimized (aspect-video)
  mobile: { 
    width: 800, 
    height: 450,  // 16:9 aspect ratio
    quality: 80,
    fit: 'cover' as const
  }
} as const

// Interface for thumbnail result
export interface ThumbnailResult {
  thumbnail: Buffer      // Main 16:9 thumbnail for cards
  square?: Buffer        // Square thumbnail for related items
  preview?: Buffer       // Large preview for detail pages
  metadata?: {
    width?: number
    height?: number
    format?: string
  }
}

// Main thumbnail service class
export class ThumbnailService {
  /**
   * Generate thumbnails for any file type
   */
  static async generateThumbnails(
    buffer: Buffer,
    mimeType: string,
    filename: string
  ): Promise<ThumbnailResult> {
    const fileType = this.getFileType(mimeType)
    
    switch (fileType) {
      case 'IMAGE':
        return await this.processImage(buffer)
      case 'VIDEO':
        return await this.createVideoPlaceholder(filename)
      case 'DOCUMENT':
        return await this.createDocumentPlaceholder(filename, mimeType)
      case 'AUDIO':
        return await this.createAudioPlaceholder(filename)
      case 'THREED':
        return await this.create3DPlaceholder(filename)
      default:
        return await this.createGenericPlaceholder(filename)
    }
  }

  /**
   * Process image files with Sharp
   */
  private static async processImage(buffer: Buffer): Promise<ThumbnailResult> {
    try {
      // Get image metadata
      const image = sharp(buffer)
      const metadata = await image.metadata()

      // Generate all thumbnail sizes in parallel
      const [thumbnail, square, preview] = await Promise.all([
        // Main card thumbnail (16:9)
        sharp(buffer)
          .resize(THUMBNAIL_SIZES.thumbnail.width, THUMBNAIL_SIZES.thumbnail.height, {
            fit: THUMBNAIL_SIZES.thumbnail.fit,
            position: 'center'
          })
          .jpeg({ quality: THUMBNAIL_SIZES.thumbnail.quality, progressive: true })
          .toBuffer(),
        
        // Square thumbnail for related items
        sharp(buffer)
          .resize(THUMBNAIL_SIZES.square.width, THUMBNAIL_SIZES.square.height, {
            fit: THUMBNAIL_SIZES.square.fit,
            position: 'attention' // Smart crop for squares
          })
          .jpeg({ quality: THUMBNAIL_SIZES.square.quality, progressive: true })
          .toBuffer(),
        
        // Large preview (16:9, no upscaling)
        sharp(buffer)
          .resize(THUMBNAIL_SIZES.preview.width, THUMBNAIL_SIZES.preview.height, {
            fit: THUMBNAIL_SIZES.preview.fit,
            withoutEnlargement: true
          })
          .jpeg({ quality: THUMBNAIL_SIZES.preview.quality, progressive: true })
          .toBuffer()
      ])

      return {
        thumbnail,
        square,
        preview,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format
        }
      }
    } catch (error) {
      console.error('Error processing image:', error)
      // Fallback to placeholder if image processing fails
      return await this.createGenericPlaceholder('image')
    }
  }

  /**
   * Create video placeholder with play button (16:9 aspect)
   */
  private static async createVideoPlaceholder(filename: string): Promise<ThumbnailResult> {
    const svg = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#1a1a2e"/>
        <rect x="10" y="10" width="380" height="205" fill="#16213e" rx="8"/>
        
        <!-- Play button -->
        <circle cx="200" cy="112" r="35" fill="#ffffff" opacity="0.9"/>
        <polygon points="190,100 190,125 215,112" fill="#1a1a2e"/>
        
        <!-- Video icon -->
        <rect x="20" y="20" width="35" height="25" fill="#e94560" rx="4"/>
        <circle cx="37" cy="32" r="3" fill="#ffffff"/>
        
        <!-- Filename -->
        <text x="200" y="180" font-family="Arial" font-size="11" fill="#ffffff" text-anchor="middle">
          ${this.truncateFilename(filename, 40)}
        </text>
        
        <!-- Type label -->
        <text x="200" y="195" font-family="Arial" font-size="9" fill="#888888" text-anchor="middle">
          VIDEO
        </text>
      </svg>
    `
    
    const thumbnail = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    return { thumbnail }
  }

  /**
   * Create document placeholder
   */
  private static async createDocumentPlaceholder(
    filename: string, 
    mimeType: string
  ): Promise<ThumbnailResult> {
    const color = this.getDocumentColor(mimeType)
    // const icon = this.getDocumentIcon(mimeType) // Reserved for icon variations
    const extension = filename.split('.').pop()?.toUpperCase() || 'DOC'
    
    const svg = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#f5f5f5"/>
        <rect x="10" y="10" width="380" height="205" fill="#ffffff" rx="8"/>
        
        <!-- Document icon -->
        <rect x="150" y="50" width="100" height="100" fill="${color}" rx="4"/>
        <rect x="160" y="65" width="80" height="2" fill="#ffffff"/>
        <rect x="160" y="75" width="80" height="2" fill="#ffffff"/>
        <rect x="160" y="85" width="60" height="2" fill="#ffffff"/>
        <rect x="160" y="95" width="70" height="2" fill="#ffffff"/>
        <rect x="160" y="105" width="50" height="2" fill="#ffffff"/>
        
        <!-- File extension badge -->
        <rect x="175" y="125" width="50" height="18" fill="${color}" rx="9"/>
        <text x="200" y="138" font-family="Arial" font-size="10" fill="#ffffff" text-anchor="middle">
          ${extension}
        </text>
        
        <!-- Filename -->
        <text x="200" y="180" font-family="Arial" font-size="11" fill="#333333" text-anchor="middle">
          ${this.truncateFilename(filename, 30)}
        </text>
      </svg>
    `
    
    const thumbnail = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    return { thumbnail }
  }

  /**
   * Create audio placeholder with waveform
   */
  private static async createAudioPlaceholder(filename: string): Promise<ThumbnailResult> {
    const svg = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#1e1e2e"/>
        <rect x="10" y="10" width="380" height="205" fill="#2a2a3e" rx="8"/>
        
        <!-- Music note icon -->
        <g transform="translate(200, 80)">
          <ellipse cx="-15" cy="25" rx="7" ry="5" fill="#ff6b6b"/>
          <ellipse cx="15" cy="18" rx="7" ry="5" fill="#ff6b6b"/>
          <rect x="-7" y="-18" width="3" height="43" fill="#ff6b6b"/>
          <rect x="23" y="-25" width="3" height="43" fill="#ff6b6b"/>
          <rect x="-7" y="-18" width="30" height="3" fill="#ff6b6b"/>
        </g>
        
        <!-- Waveform visualization -->
        ${this.generateWaveformBars()}
        
        <!-- Filename -->
        <text x="200" y="180" font-family="Arial" font-size="11" fill="#ffffff" text-anchor="middle">
          ${this.truncateFilename(filename, 40)}
        </text>
        
        <!-- Type label -->
        <text x="200" y="195" font-family="Arial" font-size="9" fill="#888888" text-anchor="middle">
          AUDIO
        </text>
      </svg>
    `
    
    const thumbnail = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    return { thumbnail }
  }

  /**
   * Create 3D model placeholder
   */
  private static async create3DPlaceholder(filename: string): Promise<ThumbnailResult> {
    const svg = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#2c3e50"/>
        <rect x="10" y="10" width="380" height="205" fill="#34495e" rx="8"/>
        
        <!-- 3D cube icon -->
        <g transform="translate(200, 100)">
          <!-- Front face -->
          <rect x="-25" y="-25" width="50" height="50" fill="#3498db" opacity="0.9"/>
          <!-- Top face -->
          <polygon points="-25,-25 25,-25 40,-40 -10,-40" fill="#5dade2" opacity="0.9"/>
          <!-- Right face -->
          <polygon points="25,-25 25,25 40,10 40,-40" fill="#2980b9" opacity="0.9"/>
        </g>
        
        <!-- Grid pattern -->
        <g opacity="0.3">
          <line x1="50" y1="100" x2="250" y2="100" stroke="#ffffff" stroke-width="0.5"/>
          <line x1="50" y1="150" x2="250" y2="150" stroke="#ffffff" stroke-width="0.5"/>
          <line x1="100" y1="50" x2="100" y2="200" stroke="#ffffff" stroke-width="0.5"/>
          <line x1="150" y1="50" x2="150" y2="200" stroke="#ffffff" stroke-width="0.5"/>
          <line x1="200" y1="50" x2="200" y2="200" stroke="#ffffff" stroke-width="0.5"/>
        </g>
        
        <!-- Filename -->
        <text x="200" y="180" font-family="Arial" font-size="11" fill="#ffffff" text-anchor="middle">
          ${this.truncateFilename(filename, 40)}
        </text>
        
        <!-- Type label -->
        <text x="200" y="195" font-family="Arial" font-size="9" fill="#888888" text-anchor="middle">
          3D MODEL
        </text>
      </svg>
    `
    
    const thumbnail = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    return { thumbnail }
  }

  /**
   * Create generic placeholder for unknown file types
   */
  private static async createGenericPlaceholder(
    filename: string
  ): Promise<ThumbnailResult> {
    const extension = filename.split('.').pop()?.toUpperCase() || 'FILE'
    
    const svg = `
      <svg width="400" height="225" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="225" fill="#ecf0f1"/>
        <rect x="10" y="10" width="380" height="205" fill="#ffffff" rx="8"/>
        
        <!-- File icon -->
        <rect x="150" y="55" width="100" height="90" fill="#95a5a6" rx="4"/>
        <polygon points="150,55 150,75 170,55" fill="#bdc3c7"/>
        
        <!-- Extension badge -->
        <rect x="175" y="115" width="50" height="18" fill="#7f8c8d" rx="9"/>
        <text x="200" y="128" font-family="Arial" font-size="10" fill="#ffffff" text-anchor="middle">
          ${extension}
        </text>
        
        <!-- Filename -->
        <text x="200" y="180" font-family="Arial" font-size="11" fill="#333333" text-anchor="middle">
          ${this.truncateFilename(filename, 30)}
        </text>
      </svg>
    `
    
    const thumbnail = await sharp(Buffer.from(svg))
      .png()
      .toBuffer()
    
    return { thumbnail }
  }

  /**
   * Helper: Determine file type from mime type
   */
  private static getFileType(mimeType: string): AssetType | string {
    if (mimeType.startsWith('image/')) return 'IMAGE'
    if (mimeType.startsWith('video/')) return 'VIDEO'
    if (mimeType.startsWith('audio/')) return 'AUDIO'
    if (mimeType.includes('pdf')) return 'DOCUMENT'
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCUMENT'
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'DOCUMENT'
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'DOCUMENT'
    if (mimeType.includes('model') || mimeType.includes('gltf') || mimeType.includes('usdz')) return 'THREED'
    return 'DOCUMENT'
  }

  /**
   * Helper: Get color for document type
   */
  private static getDocumentColor(mimeType: string): string {
    if (mimeType.includes('pdf')) return '#e74c3c'
    if (mimeType.includes('word')) return '#2980b9'
    if (mimeType.includes('excel')) return '#27ae60'
    if (mimeType.includes('powerpoint')) return '#e67e22'
    return '#95a5a6'
  }

  /**
   * Helper: Get icon for document type
   */
  private static getDocumentIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('word')) return 'DOC'
    if (mimeType.includes('excel')) return 'XLS'
    if (mimeType.includes('powerpoint')) return 'PPT'
    return 'FILE'
  }

  /**
   * Helper: Generate waveform bars for audio placeholder
   */
  private static generateWaveformBars(): string {
    const bars: string[] = []
    const barCount = 20
    const baseY = 140
    
    for (let i = 0; i < barCount; i++) {
      const height = Math.random() * 25 + 8
      const x = 100 + (i * 10)
      bars.push(`<rect x="${x}" y="${baseY - height/2}" width="6" height="${height}" fill="#ff6b6b" opacity="0.7"/>`)
    }
    
    return bars.join('\n')
  }

  /**
   * Helper: Truncate filename for display
   */
  private static truncateFilename(filename: string, maxLength: number): string {
    if (filename.length <= maxLength) return filename
    
    const extension = filename.split('.').pop() || ''
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4)
    
    return `${truncatedName}...${extension}`
  }

  /**
   * Generate thumbnail key from original file key
   */
  static generateThumbnailKey(originalKey: string, type: 'thumbnail' | 'preview' = 'thumbnail'): string {
    // assets/image/2025/08/file.jpg -> thumbnails/image/2025/08/file.jpg
    const prefix = type === 'thumbnail' ? 'thumbnails' : 'previews'
    return originalKey.replace(/^assets\//, `${prefix}/`)
  }
}

export default ThumbnailService