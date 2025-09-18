import JSZip from 'jszip'
import { saveAs } from 'file-saver'

interface DownloadableAsset {
  id: string
  title: string
  url: string
  type: string
  fileSize?: number | string
}

/**
 * Downloads multiple assets as a ZIP file
 */
export async function downloadAssetsAsZip(
  assets: DownloadableAsset[],
  zipFileName: string = 'assets.zip',
  onProgress?: (progress: number) => void
): Promise<void> {
  const zip = new JSZip()
  let completed = 0

  // Download and add each asset to the ZIP
  const downloadPromises = assets.map(async (asset) => {
    try {
      // Fetch the asset
      const response = await fetch(asset.url)
      if (!response.ok) {
        throw new Error(`Failed to download ${asset.title}`)
      }

      const blob = await response.blob()
      
      // Determine file extension based on type
      const extension = getFileExtension(asset.type, asset.url)
      const fileName = sanitizeFileName(`${asset.title}${extension}`)
      
      // Add to ZIP
      zip.file(fileName, blob)
      
      completed++
      if (onProgress) {
        onProgress((completed / assets.length) * 100)
      }
    } catch (error) {
      console.error(`Failed to download asset ${asset.title}:`, error)
      // Continue with other downloads even if one fails
    }
  })

  // Wait for all downloads to complete
  await Promise.all(downloadPromises)

  // Generate the ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }, (metadata) => {
    if (onProgress && metadata.percent) {
      // Add 100 to differentiate from download progress
      onProgress(100 + metadata.percent)
    }
  })

  // Save the ZIP file
  saveAs(zipBlob, zipFileName)
}

/**
 * Downloads a single asset
 */
export async function downloadAsset(asset: DownloadableAsset): Promise<void> {
  try {
    const response = await fetch(asset.url)
    if (!response.ok) {
      throw new Error(`Failed to download ${asset.title}`)
    }

    const blob = await response.blob()
    const extension = getFileExtension(asset.type, asset.url)
    const fileName = sanitizeFileName(`${asset.title}${extension}`)
    
    saveAs(blob, fileName)
  } catch (error) {
    console.error(`Failed to download asset ${asset.title}:`, error)
    throw error
  }
}

/**
 * Create a download link for batch download via API
 */
export async function createBatchDownloadLink(
  assetIds: string[],
  collectionId?: string
): Promise<string> {
  const params = new URLSearchParams()
  assetIds.forEach(id => params.append('assetIds', id))
  if (collectionId) {
    params.append('collectionId', collectionId)
  }

  const response = await fetch(`/api/assets/batch-download?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ assetIds, collectionId })
  })

  if (!response.ok) {
    throw new Error('Failed to create batch download link')
  }

  const data = await response.json()
  return data.downloadUrl
}

/**
 * Get file extension based on asset type or URL
 */
function getFileExtension(type: string, url: string): string {
  // Try to get extension from URL
  const urlExtension = url.split('.').pop()?.split('?')[0]
  if (urlExtension && urlExtension.length <= 4) {
    return `.${urlExtension}`
  }

  // Map asset types to extensions
  const typeMap: Record<string, string> = {
    image: '.jpg',
    video: '.mp4',
    audio: '.mp3',
    document: '.pdf',
    '2d': '.png',
    '3d': '.obj',
    pdf: '.pdf',
    ppt: '.pptx',
    doc: '.docx',
    xls: '.xlsx',
    txt: '.txt',
    zip: '.zip'
  }

  const normalizedType = type.toLowerCase()
  return typeMap[normalizedType] || '.bin'
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255) // Limit filename length
}

/**
 * Calculate total size of assets
 */
export function calculateTotalSize(assets: DownloadableAsset[]): number {
  return assets.reduce((total, asset) => {
    const size = typeof asset.fileSize === 'string' 
      ? parseInt(asset.fileSize) 
      : asset.fileSize || 0
    return total + size
  }, 0)
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}