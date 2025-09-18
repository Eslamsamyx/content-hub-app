import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type') as NotificationType | null
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

    // Build where clause
    const where: any = {
      userId: user!.id
    }

    if (isRead !== null) {
      where.isRead = isRead === 'true'
    }

    if (type) {
      where.type = type
    }

    // Get total count
    const total = await prisma.notification.count({ where })

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user!.id,
        isRead: false
      }
    })

    // Format notifications with enhanced metadata
    const formattedNotifications = notifications.map(notification => {
      const metadata = notification.metadata as any || {}
      
      // Build link based on notification type
      let link = notification.link
      if (!link && metadata.assetId) {
        link = `/library/asset/${metadata.assetId}`
      } else if (!link && metadata.collectionId) {
        link = `/library/collection/${metadata.collectionId}`
      } else if (!link && metadata.reviewId) {
        link = `/review/${metadata.reviewId}`
      }

      return {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        metadata
      }
    })

    return successResponse({
      notifications: formattedNotifications,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch notifications')
  }
}