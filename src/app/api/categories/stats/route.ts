import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { AssetType } from '@prisma/client'
import { requireAuth } from '@/lib/auth-middleware'
import { statsCache } from '@/lib/redis-cache'

export async function GET(request: NextRequest) {
  // Require authentication for category stats
  const { error } = await requireAuth(request)
  if (error) return error
  
  try {
    // Try to get from cache first (only if Redis is available)
    try {
      const cached = await statsCache.get()
      if (cached) {
        return successResponse(cached)
      }
    } catch (cacheError) {
      console.warn('Cache read failed, continuing without cache:', cacheError)
    }
    // Get counts for each asset type
    const [
      videoCount,
      imageCount,
      model3dCount,
      vector2dCount,
      audioCount,
      documentCount,
      totalCount
    ] = await Promise.all([
      prisma.asset.count({
        where: {
          type: AssetType.VIDEO,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          type: AssetType.IMAGE,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          type: AssetType.MODEL_3D,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          type: AssetType.DESIGN,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          type: AssetType.AUDIO,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          type: AssetType.DOCUMENT,
          isArchived: false
        }
      }),
      prisma.asset.count({
        where: {
          isArchived: false
        }
      })
    ])

    const categories = [
      {
        id: 'video',
        type: AssetType.VIDEO,
        count: videoCount
      },
      {
        id: 'image',
        type: AssetType.IMAGE,
        count: imageCount
      },
      {
        id: '3d',
        type: AssetType.MODEL_3D,
        count: model3dCount
      },
      {
        id: 'design',
        type: AssetType.DESIGN,
        count: vector2dCount
      },
      {
        id: 'audio',
        type: AssetType.AUDIO,
        count: audioCount
      },
      {
        id: 'document',
        type: AssetType.DOCUMENT,
        count: documentCount
      }
    ]

    const responseData = {
      categories,
      totalAssets: totalCount
    }

    // Try to cache the results (don't fail if Redis is unavailable)
    try {
      await statsCache.set(responseData)
    } catch (cacheError) {
      console.warn('Failed to cache stats:', cacheError)
    }

    return successResponse(responseData)
  } catch (error) {
    console.error('Get category stats error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch category statistics')
  }
}