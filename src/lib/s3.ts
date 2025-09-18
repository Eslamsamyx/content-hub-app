import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!

// Generate a unique file key with proper folder structure
export function generateFileKey(fileName: string, type: string, userId: string): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  return `assets/${type}/${year}/${month}/${userId}_${timestamp}_${randomString}_${sanitizedFileName}`
}

// Generate presigned URL for upload
export async function getUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  
  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Generate presigned URL for download
export async function getDownloadUrl(key: string, fileName?: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
  })
  
  return await getSignedUrl(s3Client, command, { expiresIn })
}

// Check if object exists
export async function objectExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))
    return true
  } catch {
    return false
  }
}

// Delete object
export async function deleteObject(key: string) {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }))
}

// Generate keys for different asset variants
export function generateVariantKeys(originalKey: string) {
  const keyParts = originalKey.split('/')
  const fileName = keyParts[keyParts.length - 1]
  const basePath = keyParts.slice(0, -1).join('/')
  
  return {
    thumbnail: `${basePath}/thumbnails/${fileName}`,
    preview: `${basePath}/previews/${fileName}`,
    webOptimized: `${basePath}/web/${fileName}`,
    mobile: `${basePath}/mobile/${fileName}`,
  }
}

// Upload file directly to S3 (for server-side uploads)
export async function uploadToS3(key: string, body: Buffer | Uint8Array | string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  })
  
  return await s3Client.send(command)
}