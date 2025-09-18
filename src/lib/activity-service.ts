import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

interface ActivityData {
  type: ActivityType
  userId: string
  assetId?: string
  collectionId?: string
  description?: string
  metadata?: any
}

export class ActivityService {
  /**
   * Log an activity
   */
  static async log(data: ActivityData): Promise<void> {
    try {
      await prisma.activity.create({
        data: {
          type: data.type,
          userId: data.userId,
          assetId: data.assetId,
          collectionId: data.collectionId,
          description: data.description || 'Activity logged',
          metadata: data.metadata
        }
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
      // Don't throw - activity logging shouldn't break the main flow
    }
  }

  /**
   * Log asset upload
   */
  static async logAssetUpload(userId: string, assetId: string, metadata?: any) {
    // Get asset title for description
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { title: true }
    })
    
    await this.log({
      type: 'ASSET_UPLOADED',
      userId,
      assetId,
      description: asset ? `Uploaded "${asset.title}"` : 'Uploaded new asset',
      metadata
    })
  }

  /**
   * Log asset update
   */
  static async logAssetUpdate(userId: string, assetId: string, changes?: any) {
    // Get asset title for description
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { title: true }
    })
    
    await this.log({
      type: 'ASSET_UPDATED',
      userId,
      assetId,
      description: asset ? `Updated "${asset.title}"` : 'Updated asset',
      metadata: { changes }
    })
  }

  /**
   * Log asset download
   */
  static async logAssetDownload(userId: string, assetId: string, purpose?: string) {
    // Get asset title for description
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { title: true }
    })
    
    await this.log({
      type: 'ASSET_DOWNLOADED',
      userId,
      assetId,
      description: asset ? `Downloaded "${asset.title}"` : 'Downloaded asset',
      metadata: { purpose }
    })
  }

  /**
   * Log asset view
   */
  static async logAssetView(userId: string, assetId: string) {
    // Check if user already viewed this asset recently (within last hour)
    const recentView = await prisma.activity.findFirst({
      where: {
        type: 'ASSET_VIEWED',
        userId,
        assetId,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
        }
      }
    })

    if (!recentView) {
      // Get asset title for description
      const asset = await prisma.asset.findUnique({
        where: { id: assetId },
        select: { title: true }
      })
      
      await this.log({
        type: 'ASSET_VIEWED',
        userId,
        assetId,
        description: asset ? `Viewed "${asset.title}"` : 'Viewed asset'
      })
    }
  }

  /**
   * Log collection creation
   */
  static async logCollectionCreated(userId: string, collectionId: string, collectionName: string) {
    await this.log({
      type: 'COLLECTION_CREATED',
      userId,
      collectionId,
      description: `Created collection "${collectionName}"`,
      metadata: { collectionName }
    })
  }

  /**
   * Log asset added to collection
   */
  static async logAssetAddedToCollection(
    userId: string, 
    assetId: string, 
    collectionId: string,
    assetTitle?: string,
    collectionName?: string
  ) {
    let description = 'Added asset to collection'
    if (assetTitle && collectionName) {
      description = `Added "${assetTitle}" to collection "${collectionName}"`
    } else if (assetTitle) {
      description = `Added "${assetTitle}" to collection`
    } else if (collectionName) {
      description = `Added asset to collection "${collectionName}"`
    }
    
    await this.log({
      type: 'ASSET_ADDED_TO_COLLECTION',
      userId,
      assetId,
      collectionId,
      description,
      metadata: { assetTitle, collectionName }
    })
  }

  /**
   * Log user login
   */
  static async logUserLogin(userId: string, metadata?: any) {
    // Get user info for description
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true }
    })
    
    const userName = user ? 
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : 
      'User'
    
    await this.log({
      type: 'USER_LOGIN',
      userId,
      description: `${userName} logged in`,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        userAgent: metadata?.userAgent,
        ip: metadata?.ip
      }
    })
  }

  /**
   * Log user logout
   */
  static async logUserLogout(userId: string) {
    // Get user info for description
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true }
    })
    
    const userName = user ? 
      (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email) : 
      'User'
    
    await this.log({
      type: 'USER_LOGOUT',
      userId,
      description: `${userName} logged out`,
      metadata: { timestamp: new Date() }
    })
  }

  /**
   * Get user's recent activity
   */
  static async getUserRecentActivity(userId: string, limit: number = 10) {
    return await prisma.activity.findMany({
      where: { userId },
      include: {
        asset: {
          select: {
            id: true,
            title: true,
            type: true,
            thumbnailKey: true
          }
        },
        collection: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Get asset's activity history
   */
  static async getAssetActivity(assetId: string, limit: number = 50) {
    return await prisma.activity.findMany({
      where: { assetId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  /**
   * Get activity summary for dashboard
   */
  static async getActivitySummary(days: number = 7) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [
      totalActivities,
      activeUsers,
      popularAssets,
      activityByType,
      activityByDay
    ] = await Promise.all([
      // Total activities
      prisma.activity.count({
        where: { createdAt: { gte: since } }
      }),
      // Active users count
      prisma.activity.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since } },
        _count: true
      }),
      // Most viewed/downloaded assets
      prisma.activity.groupBy({
        by: ['assetId'],
        where: {
          createdAt: { gte: since },
          type: { in: ['ASSET_VIEWED', 'ASSET_DOWNLOADED'] },
          assetId: { not: null }
        },
        _count: true,
        orderBy: {
          _count: {
            assetId: 'desc'
          }
        },
        take: 10
      }),
      // Activity by type
      prisma.activity.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: true
      }),
      // Activity by day
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM "Activity"
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    ])

    // Get asset details for popular assets
    const assetIds = popularAssets.map(a => a.assetId).filter(Boolean) as string[]
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        title: true,
        type: true,
        thumbnailKey: true
      }
    })
    const assetMap = new Map(assets.map(a => [a.id, a]))

    return {
      period: `Last ${days} days`,
      totalActivities,
      activeUsersCount: activeUsers.length,
      popularAssets: popularAssets.map(item => ({
        asset: assetMap.get(item.assetId!),
        viewCount: item._count
      })),
      activityByType: activityByType.map(item => ({
        type: item.type,
        count: item._count
      })),
      activityByDay: activityByDay as any[]
    }
  }
}