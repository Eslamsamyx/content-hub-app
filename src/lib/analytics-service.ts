import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface TimeSeriesData {
  date: string
  value: number
}

export interface DashboardMetrics {
  totalAssets: number
  activeAssets: number
  totalViews: number
  totalDownloads: number
  totalShares: number
  activeUsers: number
  storageUsed: bigint
  recentUploads: number
}

export interface TrendPeriod {
  days: number
  label: string
  groupBy: 'day' | 'week' | 'month'
}

export class AnalyticsService {
  static readonly PERIODS: Record<string, TrendPeriod> = {
    '7d': { days: 7, label: 'Last 7 days', groupBy: 'day' },
    '30d': { days: 30, label: 'Last 30 days', groupBy: 'day' },
    '90d': { days: 90, label: 'Last 90 days', groupBy: 'week' },
    '1y': { days: 365, label: 'Last year', groupBy: 'month' }
  }

  /**
   * Get dashboard overview metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      totalAssets,
      activeAssets,
      totalViews,
      totalDownloads,
      totalShares,
      activeUsers,
      storageUsed,
      recentUploads
    ] = await Promise.all([
      // Total assets
      prisma.asset.count(),
      
      // Active assets (not archived)
      prisma.asset.count({
        where: { isArchived: false }
      }),
      
      // Total views (from activities)
      prisma.activity.count({
        where: { type: 'ASSET_VIEWED' }
      }),
      
      // Total downloads
      prisma.download.count(),
      
      // Total shares
      prisma.shareLink.count(),
      
      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total storage used
      prisma.asset.aggregate({
        _sum: { fileSize: true }
      }),
      
      // Recent uploads (last 7 days)
      prisma.asset.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ])

    return {
      totalAssets,
      activeAssets,
      totalViews,
      totalDownloads,
      totalShares,
      activeUsers,
      storageUsed: storageUsed._sum.fileSize || BigInt(0),
      recentUploads
    }
  }

  /**
   * Get time-based trends for a specific metric
   */
  static async getTrends(
    metric: 'views' | 'downloads' | 'uploads' | 'shares',
    period: string = '30d'
  ): Promise<TimeSeriesData[]> {
    const periodConfig = this.PERIODS[period] || this.PERIODS['30d']
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodConfig.days)

    let data: any[] = []

    switch (metric) {
      case 'views':
        data = await this.getActivityTrends('ASSET_VIEWED', startDate, periodConfig.groupBy)
        break
      
      case 'downloads':
        data = await this.getDownloadTrends(startDate, periodConfig.groupBy)
        break
      
      case 'uploads':
        data = await this.getUploadTrends(startDate, periodConfig.groupBy)
        break
      
      case 'shares':
        data = await this.getShareTrends(startDate, periodConfig.groupBy)
        break
    }

    return this.fillMissingDates(data, startDate, new Date(), periodConfig.groupBy)
  }

  /**
   * Get top content by metric
   */
  static async getTopContent(
    metric: 'views' | 'downloads' | 'shares',
    limit: number = 10,
    period?: string
  ) {
    const startDate = period ? this.getStartDate(period) : null

    switch (metric) {
      case 'views':
        return this.getTopViewedAssets(limit, startDate)
      
      case 'downloads':
        return this.getTopDownloadedAssets(limit, startDate)
      
      case 'shares':
        return this.getTopSharedAssets(limit, startDate)
    }
  }


  /**
   * Get file type distribution
   */
  static async getFileTypeDistribution() {
    const distribution = await prisma.asset.groupBy({
      by: ['type'],
      _count: true,
      _sum: {
        fileSize: true
      },
      _avg: {
        fileSize: true
      }
    })

    return distribution.map(item => ({
      type: item.type,
      count: item._count,
      totalSize: item._sum.fileSize || BigInt(0),
      avgSize: item._avg.fileSize || BigInt(0),
      percentage: 0 // Will be calculated on the client
    }))
  }

  /**
   * Get asset-specific analytics
   */
  static async getAssetAnalytics(assetId: string, period?: string) {
    const startDate = period ? this.getStartDate(period) : null

    const [
      viewCount,
      downloadCount,
      shareCount,
      viewTrends,
      downloadTrends,
      topUsers
    ] = await Promise.all([
      // Total views
      prisma.activity.count({
        where: {
          assetId,
          type: 'ASSET_VIEWED',
          ...(startDate && { createdAt: { gte: startDate } })
        }
      }),

      // Total downloads
      prisma.download.count({
        where: {
          assetId,
          ...(startDate && { createdAt: { gte: startDate } })
        }
      }),

      // Total shares
      prisma.shareLink.count({
        where: {
          assetId,
          ...(startDate && { createdAt: { gte: startDate } })
        }
      }),

      // View trends
      this.getAssetActivityTrends(assetId, 'ASSET_VIEWED', startDate),

      // Download trends
      this.getAssetDownloadTrends(assetId, startDate),

      // Top users
      this.getAssetTopUsers(assetId, startDate)
    ])

    return {
      summary: {
        views: viewCount,
        downloads: downloadCount,
        shares: shareCount
      },
      trends: {
        views: viewTrends,
        downloads: downloadTrends
      },
      topUsers
    }
  }

  // Private helper methods

  private static getStartDate(period: string): Date {
    const periodConfig = this.PERIODS[period] || this.PERIODS['30d']
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodConfig.days)
    return startDate
  }

  private static async getActivityTrends(
    type: string,
    startDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const dateFormat = this.getDateFormat(groupBy)
    
    return await prisma.$queryRaw`
      SELECT 
        ${Prisma.raw(dateFormat)} as date,
        COUNT(*)::int as value
      FROM "Activity"
      WHERE type = ${type}
        AND created_at >= ${startDate}
      GROUP BY date
      ORDER BY date
    `
  }

  private static async getDownloadTrends(
    startDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const dateFormat = this.getDateFormat(groupBy)
    
    return await prisma.$queryRaw`
      SELECT 
        ${Prisma.raw(dateFormat)} as date,
        COUNT(*)::int as value
      FROM "Download"
      WHERE created_at >= ${startDate}
      GROUP BY date
      ORDER BY date
    `
  }

  private static async getUploadTrends(
    startDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const dateFormat = this.getDateFormat(groupBy)
    
    return await prisma.$queryRaw`
      SELECT 
        ${Prisma.raw(dateFormat)} as date,
        COUNT(*)::int as value
      FROM "Asset"
      WHERE created_at >= ${startDate}
      GROUP BY date
      ORDER BY date
    `
  }

  private static async getShareTrends(
    startDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<any[]> {
    const dateFormat = this.getDateFormat(groupBy)
    
    return await prisma.$queryRaw`
      SELECT 
        ${Prisma.raw(dateFormat)} as date,
        COUNT(*)::int as value
      FROM "ShareLink"
      WHERE created_at >= ${startDate}
      GROUP BY date
      ORDER BY date
    `
  }

  private static getDateFormat(groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return `DATE(created_at)`
      case 'week':
        return `DATE_TRUNC('week', created_at)`
      case 'month':
        return `DATE_TRUNC('month', created_at)`
    }
  }

  private static fillMissingDates(
    data: any[],
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): TimeSeriesData[] {
    const filled: TimeSeriesData[] = []
    const dataMap = new Map(data.map(d => [d.date.toISOString().split('T')[0], d.value]))

    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0]
      filled.push({
        date: dateStr,
        value: dataMap.get(dateStr) || 0
      })

      // Increment based on groupBy
      switch (groupBy) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
      }
    }

    return filled
  }

  private static async getTopViewedAssets(limit: number, startDate: Date | null) {
    const viewCounts = await prisma.activity.groupBy({
      by: ['assetId'],
      where: {
        type: 'ASSET_VIEWED',
        assetId: { not: null },
        ...(startDate && { createdAt: { gte: startDate } })
      },
      _count: true,
      orderBy: {
        _count: {
          assetId: 'desc'
        }
      },
      take: limit
    })

    const assetIds = viewCounts.map(v => v.assetId!).filter(Boolean)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        title: true,
        type: true,
        thumbnailKey: true,
        fileSize: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    })

    const assetMap = new Map(assets.map(a => [a.id, a]))

    return viewCounts.map(v => ({
      asset: assetMap.get(v.assetId!),
      count: v._count
    })).filter(item => item.asset)
  }

  private static async getTopDownloadedAssets(limit: number, startDate: Date | null) {
    const downloadCounts = await prisma.download.groupBy({
      by: ['assetId'],
      where: {
        ...(startDate && { createdAt: { gte: startDate } })
      },
      _count: true,
      orderBy: {
        _count: {
          assetId: 'desc'
        }
      },
      take: limit
    })

    const assetIds = downloadCounts.map(d => d.assetId)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        title: true,
        type: true,
        thumbnailKey: true,
        fileSize: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    })

    const assetMap = new Map(assets.map(a => [a.id, a]))

    return downloadCounts.map(d => ({
      asset: assetMap.get(d.assetId),
      count: d._count
    })).filter(item => item.asset)
  }

  private static async getTopSharedAssets(limit: number, startDate: Date | null) {
    const shareCounts = await prisma.shareLink.groupBy({
      by: ['assetId'],
      where: {
        ...(startDate && { createdAt: { gte: startDate } })
      },
      _count: true,
      orderBy: {
        _count: {
          assetId: 'desc'
        }
      },
      take: limit
    })

    const assetIds = shareCounts.map(s => s.assetId)
    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: {
        id: true,
        title: true,
        type: true,
        thumbnailKey: true,
        fileSize: true,
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    })

    const assetMap = new Map(assets.map(a => [a.id, a]))

    return shareCounts.map(s => ({
      asset: assetMap.get(s.assetId),
      count: s._count
    })).filter(item => item.asset)
  }

  private static async getAssetActivityTrends(
    assetId: string,
    type: string,
    startDate: Date | null
  ) {
    return await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as value
      FROM "Activity"
      WHERE asset_id = ${assetId}
        AND type = ${type}
        ${startDate ? Prisma.sql`AND created_at >= ${startDate}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date
    `
  }

  private static async getAssetDownloadTrends(
    assetId: string,
    startDate: Date | null
  ) {
    return await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as value
      FROM "Download"
      WHERE asset_id = ${assetId}
        ${startDate ? Prisma.sql`AND created_at >= ${startDate}` : Prisma.empty}
      GROUP BY DATE(created_at)
      ORDER BY date
    `
  }

  private static async getAssetTopUsers(
    assetId: string,
    startDate: Date | null
  ) {
    const activities = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        assetId,
        type: { in: ['ASSET_VIEWED', 'ASSET_DOWNLOADED'] },
        ...(startDate && { createdAt: { gte: startDate } })
      },
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    })

    const userIds = activities.map(a => a.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true
      }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    return activities.map(a => ({
      user: userMap.get(a.userId),
      interactions: a._count
    })).filter(item => item.user)
  }
}