import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
  ListBucketsCommand,
  StorageClass,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { Upload } from '@aws-sdk/lib-storage'
import { writeFile, unlink, mkdir, readdir, stat } from 'fs/promises'
import { existsSync, createWriteStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'

// Configuration interface
export interface S3Config {
  enabled: boolean
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  bucket?: string
  serverSideEncryption?: 'AES256' | 'aws:kms'
  storageClass?: StorageClass
  maxRetries?: number
  requestTimeout?: number
  multipartThreshold?: number // Size in bytes to trigger multipart upload
  multipartChunkSize?: number // Size of each chunk in multipart upload
}

// S3 operation metrics
export interface S3Metrics {
  uploads: number
  downloads: number
  deletes: number
  errors: number
  totalBandwidth: number
  lastError?: string
  lastOperation?: Date
}

class S3Service {
  private client: S3Client | null = null
  private config: S3Config
  private metrics: S3Metrics = {
    uploads: 0,
    downloads: 0,
    deletes: 0,
    errors: 0,
    totalBandwidth: 0,
  }
  private localStoragePath = './public/uploads'
  private isConfigured = false

  constructor() {
    // Load initial config from environment
    this.config = this.loadConfig()
    // Don't initialize in constructor - database might not be ready
    // Will initialize lazily when first needed
  }

  private loadConfig(): S3Config {
    // Default configuration from environment variables
    return {
      enabled: process.env.S3_ENABLED === 'true',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET,
      serverSideEncryption: (process.env.S3_ENCRYPTION as 'AES256' | 'aws:kms') || 'AES256',
      storageClass: (process.env.S3_STORAGE_CLASS as StorageClass) || 'STANDARD',
      maxRetries: parseInt(process.env.S3_MAX_RETRIES || '3'),
      requestTimeout: parseInt(process.env.S3_REQUEST_TIMEOUT || '30000'),
      multipartThreshold: parseInt(process.env.S3_MULTIPART_THRESHOLD || '104857600'), // 100MB
      multipartChunkSize: parseInt(process.env.S3_MULTIPART_CHUNK_SIZE || '10485760'), // 10MB
    }
  }

  // Public method to initialize the service
  public async initialize() {
    // Always try to load latest config from database
    // This ensures we get the most up-to-date bucket and region settings
    await this.initializeFromDatabase()
  }

  private async initializeFromDatabase() {
    try {
      // Import dynamically to avoid circular dependencies
      const { ConfigurationService } = await import('./config-service')
      const dbConfig = await ConfigurationService.getS3Config()
      
      if (dbConfig) {
        // Override with database configuration
        this.config = { ...this.config, ...dbConfig }
        console.log('📦 Loaded S3 configuration from database')
      }
    } catch (error) {
      console.warn('⚠️ Could not load S3 config from database, using environment variables:', error)
    }
    
    // Initialize the client with the loaded configuration
    this.initializeClient()
  }

  private initializeClient() {
    // Mark as configured if we have a bucket name (even without credentials)
    // This allows generating public URLs
    if (this.config.bucket && this.config.bucket !== 'your-bucket-name-here') {
      this.isConfigured = true
    }

    // Check if S3 credentials are properly configured for signed operations
    if (
      this.config.enabled &&
      this.config.accessKeyId &&
      this.config.accessKeyId !== 'your_access_key_here' &&
      this.config.secretAccessKey &&
      this.config.secretAccessKey !== 'your_secret_key_here' &&
      this.config.bucket
    ) {
      try {
        this.client = new S3Client({
          region: this.config.region,
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
          maxAttempts: this.config.maxRetries,
          retryMode: 'adaptive',
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 5000,
            requestTimeout: this.config.requestTimeout,
          }),
        })
        this.isConfigured = true
        console.log('✅ S3 client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize S3 client:', error)
        this.client = null
        this.isConfigured = false
      }
    } else {
      console.warn('⚠️ S3 not configured - using local storage fallback')
      this.client = null
      this.isConfigured = false
      this.ensureLocalStorageExists()
    }
  }

  private async ensureLocalStorageExists() {
    if (!existsSync(this.localStoragePath)) {
      await mkdir(this.localStoragePath, { recursive: true })
      await mkdir(join(this.localStoragePath, 'assets'), { recursive: true })
      await mkdir(join(this.localStoragePath, 'thumbnails'), { recursive: true })
      await mkdir(join(this.localStoragePath, 'temp'), { recursive: true })
      console.log('📁 Created local storage directories')
    }
  }

  // Get current configuration and status
  public getStatus(): { config: S3Config; metrics: S3Metrics; isConfigured: boolean } {
    return {
      config: { ...this.config },
      metrics: { ...this.metrics },
      isConfigured: this.isConfigured,
    }
  }

  // Update configuration and save to database
  public async updateConfig(newConfig: Partial<S3Config>, userId?: string): Promise<void> {
    // Merge with existing config
    this.config = { ...this.config, ...newConfig }
    
    // Auto-enable S3 if credentials are provided
    if (this.config.accessKeyId && this.config.secretAccessKey && this.config.bucket) {
      this.config.enabled = true
    }
    
    // Save to database
    try {
      const { ConfigurationService } = await import('./config-service')
      await ConfigurationService.saveS3Config(this.config, userId, 'Updated via admin dashboard')
      console.log('✅ S3 configuration saved to database')
    } catch (error) {
      console.error('❌ Failed to save S3 config to database:', error)
    }
    
    // Reinitialize client with new config
    this.initializeClient()
    
    // Update environment variables for consistency
    process.env.S3_ENABLED = String(this.config.enabled)
    process.env.AWS_REGION = this.config.region
    if (this.config.accessKeyId) process.env.AWS_ACCESS_KEY_ID = this.config.accessKeyId
    if (this.config.secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = this.config.secretAccessKey
    if (this.config.bucket) process.env.AWS_S3_BUCKET = this.config.bucket
  }

  // Test S3 connection
  public async testConnection(): Promise<{ success: boolean; error?: string; buckets?: string[] }> {
    if (!this.client) {
      return { success: false, error: 'S3 client not configured' }
    }

    try {
      // Try to list buckets to test credentials
      const listCommand = new ListBucketsCommand({})
      const response = await this.client.send(listCommand)
      
      // Try to get bucket location to test bucket access
      if (this.config.bucket) {
        const locationCommand = new GetBucketLocationCommand({
          Bucket: this.config.bucket,
        })
        await this.client.send(locationCommand)
      }

      return {
        success: true,
        buckets: response.Buckets?.map(b => b.Name || '') || [],
      }
    } catch (error: any) {
      this.metrics.errors++
      this.metrics.lastError = error.message
      return {
        success: false,
        error: error.message || 'Failed to connect to S3',
      }
    }
  }

  // Generate a unique file key with proper folder structure
  public generateFileKey(fileName: string, type: string, userId: string): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    return `assets/${type}/${year}/${month}/${userId}_${timestamp}_${randomString}_${sanitizedFileName}`
  }

  // Generate presigned URL for upload with best practices
  public async getUploadUrl(
    key: string,
    contentType: string,
    metadata?: Record<string, string>,
    expiresIn = 3600
  ): Promise<string> {
    // Ensure service is initialized
    if (!this.isConfigured) {
      await this.initialize()
    }
    
    if (!this.client || !this.config.bucket) {
      console.log('S3 not available, using local storage fallback', {
        hasClient: !!this.client,
        hasBucket: !!this.config.bucket,
        bucket: this.config.bucket,
        isConfigured: this.isConfigured
      })
      // Fallback to local storage URL
      return `/api/upload/local?key=${encodeURIComponent(key)}`
    }

    try {
      // CRITICAL: Create command with ONLY what browser sends
      // The signature mismatch happens when presigned URL includes parameters
      // that browser XMLHttpRequest doesn't actually send
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key
        // REMOVED: ContentType - let browser handle this via header
        // This prevents signature mismatch with Content-Type handling
      })

      // Generate presigned URL with minimal signing options
      const url = await getSignedUrl(this.client, command, { 
        expiresIn,
        // Explicitly exclude headers that cause mismatches
        signableHeaders: new Set(['host']), // Only sign the host header
        unhoistableHeaders: new Set(['content-type']) // Don't hoist content-type to query params
      })
      
      this.metrics.lastOperation = new Date()
      console.log('✅ Generated browser-compatible presigned URL')
      console.log('🔍 URL analysis:', {
        method: 'PUT',
        bucket: this.config.bucket,
        key: key.substring(0, 50) + '...',
        contentType,
        urlLength: url.length,
        hasSignature: url.includes('X-Amz-Signature'),
        hasContentType: url.includes('Content-Type')
      })
      return url
    } catch (error: any) {
      this.metrics.errors++
      this.metrics.lastError = error.message
      throw error
    }
  }

  // Generate presigned URL for download
  public async getDownloadUrl(
    key: string,
    fileName?: string,
    expiresIn = 3600
  ): Promise<string> {
    // If no bucket configured, return local URL
    if (!this.config.bucket || this.config.bucket === 'your-bucket-name-here') {
      return `/uploads/${key}`
    }

    // If client is configured, generate signed URL
    if (this.client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
        })
        
        const url = await getSignedUrl(this.client, command, { expiresIn })
        this.metrics.downloads++
        this.metrics.lastOperation = new Date()
        return url
      } catch (error: any) {
        this.metrics.errors++
        this.metrics.lastError = error.message
        console.warn('Failed to generate signed URL, falling back to public URL:', error.message)
        // Fall through to public URL generation
      }
    }

    // Generate public S3 URL format (works if bucket is public or for display purposes)
    // This ensures proper bucket and region are used even without credentials
    const region = this.config.region || 'us-east-1'
    const bucket = this.config.bucket
    
    // Use the S3 URL format
    // Standard format: https://bucket-name.s3.region.amazonaws.com/key
    // Or for us-east-1: https://bucket-name.s3.amazonaws.com/key
    if (region === 'us-east-1') {
      return `https://${bucket}.s3.amazonaws.com/${key}`
    } else {
      return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
    }
  }

  // Upload file with multipart support for large files
  public async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string | Readable,
    contentType: string,
    metadata?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const bodySize = Buffer.isBuffer(body) ? body.length : 
                     body instanceof Uint8Array ? body.length :
                     typeof body === 'string' ? Buffer.byteLength(body) : 0

    if (!this.client || !this.config.bucket) {
      // Fallback to local storage
      await this.saveToLocalStorage(key, body)
      this.metrics.uploads++
      this.metrics.totalBandwidth += bodySize
      return
    }

    try {
      // Use multipart upload for large files
      if (bodySize > this.config.multipartThreshold!) {
        await this.multipartUpload(key, body, contentType, metadata, onProgress)
      } else {
        // Regular upload for smaller files
        const command = new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ServerSideEncryption: this.config.serverSideEncryption,
          StorageClass: this.config.storageClass,
          Metadata: {
            ...metadata,
            'uploaded-at': new Date().toISOString(),
          },
        })
        
        await this.client.send(command)
      }

      this.metrics.uploads++
      this.metrics.totalBandwidth += bodySize
      this.metrics.lastOperation = new Date()
    } catch (error: any) {
      this.metrics.errors++
      this.metrics.lastError = error.message
      throw error
    }
  }

  // Multipart upload for large files
  private async multipartUpload(
    key: string,
    body: Buffer | Uint8Array | string | Readable,
    contentType: string,
    metadata?: Record<string, string>,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (!this.client || !this.config.bucket) throw new Error('S3 client not configured')

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.config.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: this.config.serverSideEncryption,
        StorageClass: this.config.storageClass,
        Metadata: {
          ...metadata,
          'uploaded-at': new Date().toISOString(),
        },
      },
      queueSize: 4, // Concurrent uploads
      partSize: this.config.multipartChunkSize,
      leavePartsOnError: false,
    })

    upload.on('httpUploadProgress', (progress) => {
      if (onProgress && progress.loaded && progress.total) {
        const percentage = (progress.loaded / progress.total) * 100
        onProgress(percentage)
      }
    })

    await upload.done()
  }

  // Check if object exists
  public async objectExists(key: string): Promise<boolean> {
    if (!this.client || !this.config.bucket) {
      // Check local storage
      return existsSync(join(this.localStoragePath, key))
    }

    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }))
      return true
    } catch {
      return false
    }
  }

  // Delete single object
  public async deleteObject(key: string): Promise<void> {
    if (!this.client || !this.config.bucket) {
      // Delete from local storage
      await this.deleteFromLocalStorage(key)
      this.metrics.deletes++
      return
    }

    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }))
      this.metrics.deletes++
      this.metrics.lastOperation = new Date()
    } catch (error: any) {
      // Ignore NoSuchKey errors
      if (error.name !== 'NoSuchKey') {
        this.metrics.errors++
        this.metrics.lastError = error.message
        throw error
      }
    }
  }

  // Delete multiple objects
  public async deleteObjects(keys: string[]): Promise<void> {
    if (!this.client || !this.config.bucket) {
      // Delete from local storage
      await Promise.all(keys.map(key => this.deleteFromLocalStorage(key)))
      this.metrics.deletes += keys.length
      return
    }

    try {
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: keys.map(key => ({ Key: key })),
          Quiet: true,
        },
      })

      await this.client.send(command)
      this.metrics.deletes += keys.length
      this.metrics.lastOperation = new Date()
    } catch (error: any) {
      this.metrics.errors++
      this.metrics.lastError = error.message
      throw error
    }
  }

  // List objects in a prefix
  public async listObjects(
    prefix: string,
    maxKeys = 1000
  ): Promise<{ key: string; size: number; lastModified: Date }[]> {
    if (!this.client || !this.config.bucket) {
      // List from local storage
      return this.listLocalStorage(prefix)
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
      })

      const response = await this.client.send(command)
      
      return (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }))
    } catch (error: any) {
      this.metrics.errors++
      this.metrics.lastError = error.message
      throw error
    }
  }

  // Generate keys for different asset variants
  public generateVariantKeys(originalKey: string) {
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

  // Local storage fallback methods
  private async saveToLocalStorage(key: string, body: Buffer | Uint8Array | string | Readable): Promise<void> {
    const filePath = join(this.localStoragePath, key)
    const dir = join(this.localStoragePath, ...key.split('/').slice(0, -1))
    
    await mkdir(dir, { recursive: true })
    
    if (body instanceof Readable) {
      const writeStream = createWriteStream(filePath)
      await pipeline(body, writeStream)
    } else {
      const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body)
      await writeFile(filePath, buffer)
    }
  }

  private async deleteFromLocalStorage(key: string): Promise<void> {
    const filePath = join(this.localStoragePath, key)
    try {
      await unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
  }

  private async listLocalStorage(prefix: string): Promise<{ key: string; size: number; lastModified: Date }[]> {
    const results: { key: string; size: number; lastModified: Date }[] = []
    const basePath = join(this.localStoragePath, prefix)
    
    try {
      const files = await this.walkDirectory(basePath)
      for (const file of files) {
        const stats = await stat(file)
        const key = file.replace(this.localStoragePath + '/', '')
        results.push({
          key,
          size: stats.size,
          lastModified: stats.mtime,
        })
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
    
    return results
  }

  private async walkDirectory(dir: string): Promise<string[]> {
    const results: string[] = []
    
    try {
      const entries = await readdir(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory()) {
          results.push(...await this.walkDirectory(fullPath))
        } else {
          results.push(fullPath)
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') throw error
    }
    
    return results
  }

  // Get storage usage statistics
  public async getStorageStats(): Promise<{
    totalSize: number
    fileCount: number
    largestFile?: { key: string; size: number }
  }> {
    const allFiles = await this.listObjects('assets/', 10000)
    
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0)
    const largestFile = allFiles.sort((a, b) => b.size - a.size)[0]
    
    return {
      totalSize,
      fileCount: allFiles.length,
      largestFile,
    }
  }
}

// Export singleton instance
export const s3Service = new S3Service()

// Export convenience functions for backward compatibility
export const getUploadUrl = async (key: string, contentType: string, expiresIn?: number) => {
  // Ensure service is initialized before use
  await s3Service.initialize()
  return s3Service.getUploadUrl(key, contentType, undefined, expiresIn)
}

export const getDownloadUrl = async (key: string, fileName?: string, expiresIn?: number) => {
  await s3Service.initialize()
  return s3Service.getDownloadUrl(key, fileName, expiresIn)
}

export const uploadToS3 = async (key: string, body: Buffer | Uint8Array | string, contentType: string) => {
  await s3Service.initialize()
  return s3Service.uploadFile(key, body, contentType)
}

export const deleteObject = async (key: string) => {
  await s3Service.initialize()
  return s3Service.deleteObject(key)
}

export const objectExists = async (key: string) => {
  await s3Service.initialize()
  return s3Service.objectExists(key)
}

export const generateFileKey = (fileName: string, type: string, userId: string) =>
  s3Service.generateFileKey(fileName, type, userId)

export const generateVariantKeys = (originalKey: string) =>
  s3Service.generateVariantKeys(originalKey)