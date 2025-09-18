import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { AssetType, Prisma } from '@prisma/client'

// GET /api/profile/uploads - Get user's uploaded assets
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') as AssetType | undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const includeArchived = searchParams.get('includeArchived') === 'true'

    // Build where clause
    const where: Prisma.AssetWhereInput = {
      uploadedById: user!.id,
      ...(!includeArchived && { isArchived: false }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(type && { type }),
    }

    // Build orderBy
    const orderBy: Prisma.AssetOrderByWithRelationInput = {}
    if (sortBy === 'title') {
      orderBy.title = sortOrder
    } else if (sortBy === 'fileSize') {
      orderBy.fileSize = sortOrder
    } else if (sortBy === 'downloads') {
      orderBy.downloadCount = sortOrder
    } else if (sortBy === 'views') {
      orderBy.viewCount = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Execute queries in parallel
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              downloads: true,
              favorites: true,
              collections: true,
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ])

    // Get upload statistics
    const stats = await prisma.asset.aggregate({
      where: {
        uploadedById: user!.id,
        isArchived: false,
      },
      _sum: {
        fileSize: true,
        viewCount: true,
        downloadCount: true,
      },
      _count: true,
    })

    // Transform the response
    const transformedAssets = assets.map(asset => ({
      id: asset.id,
      title: asset.title,
      description: asset.description,
      type: asset.type,
      fileSize: asset.fileSize.toString(),
      mimeType: asset.mimeType,
      category: asset.category,
      tags: asset.tags.map(at => at.tag),
      isArchived: asset.isArchived,
      readyForPublishing: asset.readyForPublishing,
      viewCount: asset.viewCount,
      downloadCount: asset.downloadCount,
      favoriteCount: asset._count.favorites,
      collectionCount: asset._count.collections,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    }))

    return successResponse(
      {
        assets: transformedAssets,
        stats: {
          totalAssets: stats._count,
          totalSize: stats._sum.fileSize?.toString() || '0',
          totalViews: stats._sum.viewCount || 0,
          totalDownloads: stats._sum.downloadCount || 0,
        },
      },
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    )
  } catch (error) {
    console.error('Get user uploads error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch uploads')
  }
}