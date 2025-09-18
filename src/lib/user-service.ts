import { prisma } from '@/lib/prisma'
import { UserRole, CreativeRole, Prisma } from '@prisma/client'

export interface UserListFilters {
  role?: UserRole
  creativeRole?: CreativeRole
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserStats {
  totalUploads: number
  totalDownloads: number
  totalCollections: number
  totalReviews: number
  storageUsed: bigint
  lastActive: Date | null
}

export interface UserUpdateData {
  firstName?: string
  lastName?: string
  role?: UserRole
  creativeRole?: CreativeRole | null
  bio?: string
  location?: string
  socialLinks?: any
  isActive?: boolean
}

export class UserService {
  /**
   * Get paginated list of users with filters
   */
  static async listUsers(filters: UserListFilters) {
    const {
      role,
      creativeRole,
      isActive,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters

    // Build where clause
    const where: Prisma.UserWhereInput = {}

    if (role) {
      where.role = role
    }

    if (creativeRole) {
      where.creativeRole = creativeRole
    }


    if (isActive !== undefined) {
      where.isActive = isActive
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users with stats
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        creativeRole: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            uploads: true,
            downloads: true,
            collections: true,
            reviews: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    })

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Get detailed user information
   */
  static async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            uploads: true,
            downloads: true,
            collections: true,
            reviews: true,
            favorites: true,
            activities: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    // Get additional stats
    const [
      storageUsed,
      recentActivity
    ] = await Promise.all([
      // Total storage used by user's uploads
      prisma.asset.aggregate({
        where: { uploadedById: userId },
        _sum: { fileSize: true }
      }),

      // Recent activity
      prisma.activity.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      }),

    ])

    return {
      ...user,
      stats: {
        totalUploads: user._count.uploads,
        totalDownloads: user._count.downloads,
        totalCollections: user._count.collections,
        totalReviews: user._count.reviews,
        totalFavorites: user._count.favorites,
        totalActivities: user._count.activities,
        storageUsed: storageUsed._sum.fileSize || BigInt(0),
        lastActive: recentActivity?.createdAt || user.lastLogin
      }
    }
  }

  /**
   * Update user information (admin)
   */
  static async updateUser(userId: string, data: UserUpdateData) {
    // Validate role changes
    if (data.role) {
      if (data.role === 'CREATIVE' && !data.creativeRole) {
        throw new Error('Creative role must be specified for CREATIVE users')
      }
      if (data.role !== 'CREATIVE' && data.creativeRole) {
        data.creativeRole = null
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data
        // name field doesn't exist in User model
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        creativeRole: true,
        isActive: true
      }
    })

    return updatedUser
  }

  /**
   * Activate or deactivate a user
   */
  static async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        isActive: true
      }
    })

    // If deactivating, you might want to:
    // - Revoke active sessions
    // - Cancel pending reviews
    // - Notify relevant parties

    return user
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string, days: number = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const [
      uploadCount,
      downloadCount,
      viewCount,
      shareCount,
      activityByType,
      topAssets
    ] = await Promise.all([
      // Uploads in period
      prisma.asset.count({
        where: {
          uploadedById: userId,
          createdAt: { gte: since }
        }
      }),

      // Downloads in period
      prisma.download.count({
        where: {
          userId,
          createdAt: { gte: since }
        }
      }),

      // Views in period
      prisma.activity.count({
        where: {
          userId,
          type: 'ASSET_VIEWED',
          createdAt: { gte: since }
        }
      }),

      // Shares created
      prisma.shareLink.count({
        where: {
          createdById: userId,
          createdAt: { gte: since }
        }
      }),

      // Activity breakdown
      prisma.activity.groupBy({
        by: ['type'],
        where: {
          userId,
          createdAt: { gte: since }
        },
        _count: true
      }),

      // Most viewed assets by this user
      prisma.activity.groupBy({
        by: ['assetId'],
        where: {
          userId,
          type: 'ASSET_VIEWED',
          assetId: { not: null },
          createdAt: { gte: since }
        },
        _count: true,
        orderBy: {
          _count: {
            assetId: 'desc'
          }
        },
        take: 5
      })
    ])

    // Get asset details for top assets
    const assetIds = topAssets.map(a => a.assetId!).filter(Boolean)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        title: true,
        type: true
      }
    })
    const assetMap = new Map(assets.map(a => [a.id, a]))

    return {
      period: `Last ${days} days`,
      summary: {
        uploads: uploadCount,
        downloads: downloadCount,
        views: viewCount,
        shares: shareCount
      },
      activityByType: activityByType.map(item => ({
        type: item.type,
        count: item._count
      })),
      topViewedAssets: topAssets.map(item => ({
        asset: assetMap.get(item.assetId!),
        viewCount: item._count
      })).filter(item => item.asset)
    }
  }

  /**
   * Search for users by various criteria
   */
  static async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
              // { name: { contains: query, mode: 'insensitive' } } // Field doesn't exist
            ]
          }
        ]
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true
      },
      take: limit
    })

    return users
  }

}