import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import * as crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'sk_live_'
  const randomBytes = crypto.randomBytes(32)
  const key = randomBytes.toString('base64url')
  return prefix + key
}

// Hash API key for storage
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

// POST /api/admin/security/api-keys - Generate new API key
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    const { name, permissions = [] } = await request.json()

    if (!name) {
      return ApiErrors.BAD_REQUEST('API key name is required')
    }

    // Generate new API key
    const apiKey = generateApiKey()
    const hashedKey = hashApiKey(apiKey)

    // Save to database
    const savedKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash: hashedKey,
        permissions: permissions as any,
        createdById: user!.id,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
      }
    })

    // Create audit log
    await prisma.configurationHistory.create({
      data: {
        configKey: 'api_key',
        action: 'CREATE',
        userId: user!.id,
        changes: { created: name } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return successResponse({
      id: savedKey.id,
      key: apiKey, // Return the actual key only once
      name: savedKey.name,
      permissions: savedKey.permissions,
      expiresAt: savedKey.expiresAt,
      message: 'API key generated successfully. Copy this key now as it won\'t be shown again.'
    })
  } catch (error) {
    console.error('Generate API key error:', error)
    return ApiErrors.SERVER_ERROR('Failed to generate API key')
  }
}

// GET /api/admin/security/api-keys - List all API keys
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { revokedAt: null },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
        lastUsedAt: true,
        createdBy: {
          select: {
            firstName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse({ apiKeys })
  } catch (error) {
    console.error('List API keys error:', error)
    return ApiErrors.SERVER_ERROR('Failed to list API keys')
  }
}