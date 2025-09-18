import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// POST /api/notifications/mark-all-read - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Update all unread notifications
    const result = await prisma.notification.updateMany({
      where: {
        userId: user!.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return successResponse({
      updatedCount: result.count,
      message: `Marked ${result.count} notifications as read`
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    return ApiErrors.SERVER_ERROR('Failed to mark all notifications as read')
  }
}