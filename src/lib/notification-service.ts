import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'
import EmailService from '@/lib/email-service'

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  metadata?: any
}

export class NotificationService {
  /**
   * Send a notification to a user
   * Checks user preferences before creating the notification
   */
  static async send(data: NotificationData): Promise<void> {
    try {
      // Get user preferences
      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: data.userId }
      })

      // Check if in-app notifications are enabled
      const shouldSendInApp = await this.shouldSendInApp(preferences, data.type)
      
      if (shouldSendInApp) {
        // Create in-app notification
        await prisma.notification.create({
          data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata
          }
        })
      }

      // Check if email notifications are enabled
      const shouldSendEmail = await this.shouldSendEmail(preferences, data.type)
      
      if (shouldSendEmail) {
        // Get user details for email
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { email: true, firstName: true, lastName: true }
        })

        if (user?.email) {
          const fullName = `${user.firstName} ${user.lastName}`.trim()
          await EmailService.sendNotificationEmail({
            userId: data.userId,
            userEmail: user.email,
            userName: fullName || undefined,
            type: data.type,
            title: data.title,
            message: data.message,
            actionUrl: data.link,
            metadata: data.metadata
          })
        }
      }
    } catch (error) {
      console.error('Failed to send notification:', error)
      // Don't throw - notifications shouldn't break the main flow
    }
  }

  /**
   * Send notifications to multiple users
   */
  static async sendBulk(userIds: string[], notificationData: Omit<NotificationData, 'userId'>): Promise<void> {
    const promises = userIds.map(userId => 
      this.send({ ...notificationData, userId })
    )
    await Promise.allSettled(promises)
  }

  /**
   * Send notification to all users with a specific role
   */
  static async sendToRole(role: string, notificationData: Omit<NotificationData, 'userId'>): Promise<void> {
    const users = await prisma.user.findMany({
      where: { role: role as any },
      select: { id: true }
    })
    
    await this.sendBulk(users.map(u => u.id), notificationData)
  }

  /**
   * Check if in-app notification should be sent based on preferences
   */
  private static async shouldSendInApp(
    preferences: any | null, 
    type: NotificationType
  ): Promise<boolean> {
    if (!preferences || !preferences.inAppEnabled) {
      return true // Default to sending if no preferences
    }

    switch (type) {
      case 'ASSET_APPROVED':
        return preferences.inAppAssetApproved
      case 'ASSET_REJECTED':
        return preferences.inAppAssetRejected
      case 'REVIEW_ASSIGNED':
      case 'REVIEW_REQUESTED':
        return preferences.inAppReviewAssigned
      case 'ASSET_SHARED':
        return preferences.inAppAssetShared
      case 'COLLECTION_SHARED':
        return preferences.inAppCollectionShared
      case 'SYSTEM_UPDATE':
        return preferences.inAppSystemUpdates
      default:
        return true
    }
  }

  /**
   * Check if email notification should be sent based on preferences
   */
  private static async shouldSendEmail(
    preferences: any | null, 
    type: NotificationType
  ): Promise<boolean> {
    if (!preferences || !preferences.emailEnabled) {
      return false // Default to not sending emails if no preferences
    }

    switch (type) {
      case 'ASSET_APPROVED':
        return preferences.emailAssetApproved
      case 'ASSET_REJECTED':
        return preferences.emailAssetRejected
      case 'REVIEW_ASSIGNED':
      case 'REVIEW_REQUESTED':
        return preferences.emailReviewAssigned
      case 'ASSET_SHARED':
        return preferences.emailAssetShared
      case 'COLLECTION_SHARED':
        return preferences.emailCollectionShared
      default:
        return false // Don't send emails for other types by default
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { userId }
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true
      })
    ])

    return {
      total,
      unread,
      byType: byType.map(item => ({
        type: item.type,
        count: item._count
      }))
    }
  }

  /**
   * Clean up old notifications
   */
  static async cleanup(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    })

    return result.count
  }
}