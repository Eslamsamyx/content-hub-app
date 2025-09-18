import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// DELETE /api/notifications/:id - Delete notification
export async function DELETE(
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
        userId: true
      }
    })

    if (!notification) {
      return ApiErrors.NOT_FOUND('Notification not found')
    }

    // Check ownership
    if (notification.userId !== user!.id) {
      return ApiErrors.FORBIDDEN()
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    })

    // Get updated counts
    const [total, unreadCount] = await Promise.all([
      prisma.notification.count({
        where: { userId: user!.id }
      }),
      prisma.notification.count({
        where: {
          userId: user!.id,
          isRead: false
        }
      })
    ])

    return successResponse({
      message: 'Notification deleted successfully',
      remainingTotal: total,
      unreadCount
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    return ApiErrors.SERVER_ERROR('Failed to delete notification')
  }
}