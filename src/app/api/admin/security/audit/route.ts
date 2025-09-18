import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// GET /api/admin/security/audit - Get configuration audit logs
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_settings')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '50'))
    const offset = parseInt(searchParams.get('offset') || '0')
    const configKey = searchParams.get('configKey')

    // Build query
    const where = configKey ? { configKey } : {}

    // Get audit logs
    const logs = await prisma.configurationHistory.findMany({
      where,
      select: {
        id: true,
        configKey: true,
        action: true,
        changes: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        user: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Transform logs to match the expected format
    const formattedLogs = logs.map(log => {
      // Extract field and value from changes
      let field = log.configKey
      let oldValue = null
      let newValue = null

      if (log.changes && typeof log.changes === 'object') {
        const changes = log.changes as any
        if (changes.field) field = changes.field
        if (changes.oldValue !== undefined) oldValue = changes.oldValue
        if (changes.newValue !== undefined) newValue = changes.newValue
        if (changes.updated) newValue = changes.updated
        if (changes.created) newValue = changes.created
        if (changes.revoked) oldValue = changes.revoked
      }

      return {
        id: log.id,
        timestamp: log.createdAt,
        userId: log.user.id,
        userEmail: log.user.email,
        section: log.configKey.replace('_config', ''),
        field: field,
        oldValue: oldValue,
        newValue: newValue,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent
      }
    })

    return successResponse({ logs: formattedLogs })
  } catch (error) {
    console.error('Get audit logs error:', error)
    return ApiErrors.SERVER_ERROR('Failed to load audit logs')
  }
}