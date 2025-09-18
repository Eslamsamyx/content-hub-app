import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// PATCH /api/notifications/:id/read - Mark notification as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Get notification to verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isRead: true
      }
    })

    if (!notification) {
      return ApiErrors.NOT_FOUND('Notification not found')
    }

    // Check ownership
    if (notification.userId !== user!.id) {
      return ApiErrors.FORBIDDEN()
    }

    // Check if already read
    if (notification.isRead) {
      return successResponse({
        id: notification.id,
        isRead: true,
        message: 'Notification already marked as read'
      })
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true
      }
    })

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user!.id,
        isRead: false
      }
    })

    return successResponse({
      id: updatedNotification.id,
      isRead: updatedNotification.isRead,
      unreadCount,
      message: 'Notification marked as read'
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    return ApiErrors.SERVER_ERROR('Failed to mark notification as read')
  }
}