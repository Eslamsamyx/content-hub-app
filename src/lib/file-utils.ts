import mime from 'mime-types'
import { AssetType } from '@prisma/client'

// File size limits in bytes
export const FILE_SIZE_LIMITS = {
  IMAGE: 50 * 1024 * 1024, // 50MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  DOCUMENT: 100 * 1024 * 1024, // 100MB
  AUDIO: 200 * 1024 * 1024, // 200MB
  MODEL_3D: 200 * 1024 * 1024, // 200MB
  DESIGN: 100 * 1024 * 1024, // 100MB
}

// Allowed MIME types by asset type
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
    'image/bmp',
  ],
  VIDEO: [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'video/webm',
    'video/ogg',
  ],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  AUDIO: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/webm',
  ],
  MODEL_3D: [
    'model/gltf+json',
    'model/gltf-binary',
    'application/octet-stream', // for .glb files
    'model/obj',
    'model/fbx',
    'application/x-fbx',
  ],
  DESIGN: [
    'application/postscript', // .ai, .eps
    'image/vnd.adobe.photoshop', // .psd
    'application/x-photoshop',
    'application/photoshop',
    'application/psd',
    'image/x-photoshop',
    'image/psd',
    'application/x-sketch', // .sketch
    'application/zip', // for design files packaged as zip
  ],
}

// Get asset type from MIME type
export function getAssetTypeFromMime(mimeType: string): AssetType | null {
  const normalizedMime = mimeType.toLowerCase()
  
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(normalizedMime)) {
      return type as AssetType
    }
  }
  
  // Check by file extension for some edge cases
  const ext = mime.extension(mimeType)
  if (ext) {
    if (['glb', 'gltf', 'obj', 'fbx'].includes(ext)) return 'MODEL_3D'
    if (['ai', 'eps', 'psd', 'sketch'].includes(ext)) return 'DESIGN'
  }
  
  return null
}

// Validate file type and size
export function validateFile(mimeType: string, fileSize: number): { valid: boolean; error?: string } {
  const assetType = getAssetTypeFromMime(mimeType)
  
  if (!assetType) {
    return { valid: false, error: 'Unsupported file type' }
  }
  
  const sizeLimit = FILE_SIZE_LIMITS[assetType]
  if (fileSize > sizeLimit) {
    const limitMB = Math.round(sizeLimit / (1024 * 1024))
    return { valid: false, error: `File size exceeds ${limitMB}MB limit` }
  }
  
  return { valid: true }
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

// Generate a safe filename
export function sanitizeFilename(filename: string): string {
  // Remove special characters but keep dots and hyphens
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get content type from file extension
export function getContentType(filename: string): string {
  return mime.lookup(filename) || 'application/octet-stream'
}