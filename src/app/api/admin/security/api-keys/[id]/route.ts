import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// DELETE /api/admin/security/api-keys/[id] - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    const { id: keyId } = await params

    // Check if key exists
    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId }
    })

    if (!apiKey) {
      return ApiErrors.NOT_FOUND('API key not found')
    }

    if (apiKey.revokedAt) {
      return ApiErrors.BAD_REQUEST('API key is already revoked')
    }

    // Revoke the key
    await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        revokedAt: new Date(),
        revokedById: user!.id
      }
    })

    // Create audit log
    await prisma.configurationHistory.create({
      data: {
        configKey: 'api_key',
        action: 'REVOKE',
        userId: user!.id,
        changes: { revoked: apiKey.name } as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    return successResponse({ message: 'API key revoked successfully' })
  } catch (error) {
    console.error('Revoke API key error:', error)
    return ApiErrors.SERVER_ERROR('Failed to revoke API key')
  }
}