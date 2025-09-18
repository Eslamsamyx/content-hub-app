/**
 * Configuration Service
 * Handles secure storage and retrieval of system configurations from database
 */

import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Configuration keys
export const CONFIG_KEYS = {
  S3: 's3_config',
  SES: 'ses_config',
  CDN: 'cdn_config',
  REDIS: 'redis_config',
} as const

// Encryption settings
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY
  ? Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex')
  : crypto.createHash('sha256').update(
      process.env.NEXTAUTH_SECRET || 'default-key-change-in-production'
    ).digest()

interface EncryptedData {
  encrypted: string
  iv: string
  authTag: string
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): EncryptedData {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  }
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

/**
 * Encrypt configuration object with sensitive fields
 */
function encryptConfig(config: any, sensitiveFields: string[]): any {
  const encrypted = { ...config }
  
  for (const field of sensitiveFields) {
    if (config[field]) {
      const encryptedData = encrypt(config[field])
      encrypted[field] = encryptedData
    }
  }
  
  return encrypted
}

/**
 * Decrypt configuration object with sensitive fields
 */
function decryptConfig(config: any, sensitiveFields: string[]): any {
  const decrypted = { ...config }
  
  for (const field of sensitiveFields) {
    if (config[field] && typeof config[field] === 'object' && config[field].encrypted) {
      try {
        decrypted[field] = decrypt(config[field])
      } catch (error) {
        console.error(`Failed to decrypt field ${field}:`, error)
        decrypted[field] = null
      }
    }
  }
  
  return decrypted
}

export class ConfigurationService {
  /**
   * Get configuration from database
   */
  static async getConfig(key: string): Promise<any | null> {
    try {
      const config = await prisma.systemConfiguration.findUnique({
        where: { key }
      })
      
      if (!config) {
        return null
      }
      
      // Decrypt sensitive fields based on config type
      if (config.encrypted) {
        const sensitiveFields = this.getSensitiveFields(key)
        return decryptConfig(config.value, sensitiveFields)
      }
      
      return config.value
    } catch (error) {
      console.error(`Failed to get config ${key}:`, error)
      return null
    }
  }
  
  /**
   * Save configuration to database with audit trail
   */
  static async saveConfig(
    key: string,
    value: any,
    userId?: string,
    reason?: string,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      // Get current config for history
      const currentConfig = await prisma.systemConfiguration.findUnique({
        where: { key }
      })
      
      // Encrypt sensitive fields
      const sensitiveFields = this.getSensitiveFields(key)
      const encryptedValue = sensitiveFields.length > 0 
        ? encryptConfig(value, sensitiveFields)
        : value
      
      // Save or update configuration
      await prisma.systemConfiguration.upsert({
        where: { key },
        create: {
          key,
          value: encryptedValue,
          encrypted: sensitiveFields.length > 0,
          description: this.getConfigDescription(key),
          lastModifiedById: userId,
          version: 1
        },
        update: {
          value: encryptedValue,
          encrypted: sensitiveFields.length > 0,
          lastModifiedById: userId,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      })
      
      // Create audit history entry
      if (userId) {
        await prisma.configurationHistory.create({
          data: {
            configKey: key,
            action: currentConfig ? 'UPDATE' : 'CREATE',
            changes: {
              previousValue: currentConfig?.value || null,
              newValue: encryptedValue
            },
            userId: userId,
            changeReason: reason,
            ipAddress
          }
        })
      }
      
      return true
    } catch (error) {
      console.error(`Failed to save config ${key}:`, error)
      return false
    }
  }
  
  /**
   * Get S3 configuration
   */
  static async getS3Config() {
    const config = await this.getConfig(CONFIG_KEYS.S3)
    
    // Fall back to environment variables if no database config
    if (!config) {
      return {
        enabled: process.env.S3_ENABLED === 'true',
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET,
        // useAcceleration removed - not supported in me-central-1
        serverSideEncryption: process.env.S3_ENCRYPTION || 'AES256',
        storageClass: process.env.S3_STORAGE_CLASS || 'STANDARD',
      }
    }
    
    return config
  }
  
  /**
   * Save S3 configuration
   */
  static async saveS3Config(config: any, userId?: string, reason?: string, ipAddress?: string) {
    // Remove placeholder values
    if (config.accessKeyId === 'your_access_key_here') {
      delete config.accessKeyId
    }
    if (config.secretAccessKey === 'your_secret_key_here') {
      delete config.secretAccessKey
    }
    
    return this.saveConfig(CONFIG_KEYS.S3, config, userId, reason, ipAddress)
  }
  
  /**
   * Get SES configuration
   */
  static async getSESConfig() {
    const config = await this.getConfig(CONFIG_KEYS.SES)
    
    // Fall back to environment variables if no database config
    if (!config) {
      return {
        enabled: false,
        provider: 'smtp',
        region: process.env.AWS_REGION || 'us-east-1',
        fromEmail: process.env.EMAIL_FROM,
        fromName: process.env.EMAIL_FROM_NAME || 'Content Hub',
      }
    }
    
    return config
  }
  
  /**
   * Save SES configuration
   */
  static async saveSESConfig(config: any, userId?: string, reason?: string, ipAddress?: string) {
    return this.saveConfig(CONFIG_KEYS.SES, config, userId, reason, ipAddress)
  }
  
  /**
   * Get configuration history
   */
  static async getConfigHistory(key: string, limit: number = 10) {
    return prisma.configurationHistory.findMany({
      where: { configKey: key },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
  
  /**
   * Get sensitive fields for each config type
   */
  private static getSensitiveFields(key: string): string[] {
    switch (key) {
      case CONFIG_KEYS.S3:
        return ['accessKeyId', 'secretAccessKey']
      case CONFIG_KEYS.SES:
        return ['accessKeyId', 'secretAccessKey', 'smtpPassword', 'apiKey']
      case CONFIG_KEYS.REDIS:
        return ['password']
      default:
        return []
    }
  }
  
  /**
   * Get description for config type
   */
  private static getConfigDescription(key: string): string {
    switch (key) {
      case CONFIG_KEYS.S3:
        return 'AWS S3 storage configuration for asset management'
      case CONFIG_KEYS.SES:
        return 'Email service configuration (SES/SMTP/SendGrid/Mailgun)'
      case CONFIG_KEYS.CDN:
        return 'CDN configuration for asset delivery'
      case CONFIG_KEYS.REDIS:
        return 'Redis configuration for caching and queues'
      default:
        return 'System configuration'
    }
  }
  
  /**
   * Test S3 configuration
   */
  static async testS3Config(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { S3Client, ListBucketsCommand } = await import('@aws-sdk/client-s3')
      
      const client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
      })
      
      await client.send(new ListBucketsCommand({}))
      
      return { success: true }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to S3' 
      }
    }
  }
  
  /**
   * Test SES configuration
   */
  static async testSESConfig(config: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (config.provider === 'ses') {
        const { SESClient, GetAccountSendingEnabledCommand } = await import('@aws-sdk/client-ses')
        
        const client = new SESClient({
          region: config.region,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        })
        
        await client.send(new GetAccountSendingEnabledCommand({}))
        
        return { success: true }
      } else if (config.provider === 'smtp') {
        // Test SMTP connection
        const nodemailer = await import('nodemailer')
        
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
          }
        })
        
        await transporter.verify()
        
        return { success: true }
      }
      
      return { success: false, error: 'Unsupported provider' }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to email service' 
      }
    }
  }
}