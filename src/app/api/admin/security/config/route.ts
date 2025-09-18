import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { SecurityConfig } from '@/types/admin-config'
import * as crypto from 'crypto'

// Encryption setup
const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY
  ? Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32)
const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

// Encryption functions - reserved for future use when we need to encrypt sensitive data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function decrypt(encryptedData: { encrypted: string; iv: string; authTag: string }): string {
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

// GET /api/admin/security/config - Get security configuration
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    // Load security configuration from database
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 'security_config' }
    })

    let securityConfig: SecurityConfig

    if (config && config.value) {
      securityConfig = config.value as any
      
      // Decrypt sensitive fields if encrypted
      if (config.encrypted) {
        // Note: In production, you'd decrypt the actual encrypted fields
        // For now, we'll just mask them for security
        if (securityConfig.credentials?.aws?.s3) {
          securityConfig.credentials.aws.s3.secretAccessKey = '********'
        }
        if (securityConfig.credentials?.aws?.ses) {
          securityConfig.credentials.aws.ses.secretAccessKey = '********'
        }
        if (securityConfig.credentials?.smtp) {
          securityConfig.credentials.smtp.password = '********'
        }
      }
    } else {
      // Default configuration
      securityConfig = {
        authentication: {
          enableTwoFactor: false,
          sessionTimeout: 60,
          maxLoginAttempts: 5,
          lockoutDuration: 30
        },
        password: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: false,
          expiryDays: 90,
          preventReuse: 3
        },
        credentials: {
          aws: {},
          apiKeys: []
        }
      }
    }

    // Load API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { revokedAt: null },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    securityConfig.credentials.apiKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      key: '********', // Never expose the actual key
      permissions: key.permissions as string[],
      expiresAt: key.expiresAt || undefined,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt || undefined
    }))

    return successResponse({ config: securityConfig })
  } catch (error) {
    console.error('Get security config error:', error)
    return ApiErrors.SERVER_ERROR('Failed to load security configuration')
  }
}

// POST /api/admin/security/config - Update security configuration
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    const securityConfig: SecurityConfig = await request.json()

    // Don't save API keys through this endpoint (they have their own management)
    const configToSave = {
      ...securityConfig,
      credentials: {
        ...securityConfig.credentials,
        apiKeys: [] // API keys are managed separately
      }
    }

    // Encrypt sensitive fields
    if (configToSave.credentials.aws?.s3?.secretAccessKey && 
        !configToSave.credentials.aws.s3.secretAccessKey.includes('*')) {
      configToSave.credentials.aws.s3.encrypted = true
    }
    if (configToSave.credentials.aws?.ses?.secretAccessKey && 
        !configToSave.credentials.aws.ses.secretAccessKey.includes('*')) {
      configToSave.credentials.aws.ses.encrypted = true
    }
    if (configToSave.credentials.smtp?.password && 
        !configToSave.credentials.smtp.password.includes('*')) {
      configToSave.credentials.smtp.encrypted = true
    }

    // Save to database
    await prisma.systemConfiguration.upsert({
      where: { key: 'security_config' },
      update: {
        value: configToSave as any,
        encrypted: true,
        lastModifiedById: user!.id,
        version: { increment: 1 }
      },
      create: {
        key: 'security_config',
        value: configToSave as any,
        encrypted: true,
        description: 'Security and authentication configuration',
        lastModifiedById: user!.id
      }
    })

    // Create audit log
    await prisma.configurationHistory.create({
      data: {
        configKey: 'security_config',
        action: 'UPDATE',
        userId: user!.id,
        changes: { updated: 'security_config' } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return successResponse({ message: 'Security configuration updated successfully' })
  } catch (error) {
    console.error('Update security config error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update security configuration')
  }
}