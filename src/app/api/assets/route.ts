import { NextRequest } from 'next/server'
import { optionalAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { AssetType, UsageType, Prisma } from '@prisma/client'

// GET /api/assets - List assets with filters (public endpoint with optional auth)
export async function GET(request: NextRequest) {
  try {
    // Optional authentication - public users can view public assets
    const { user } = await optionalAuth(request)
    const isAuthenticated = !!user

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || undefined
    const typeParam = searchParams.get('type')
    const type = typeParam && typeParam !== 'all' ? typeParam.toUpperCase() as AssetType : undefined
    const category = searchParams.get('category') || undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const company = searchParams.get('company') || undefined
    const eventName = searchParams.get('eventName') || undefined
    const usage = searchParams.get('usage') as 'internal' | 'public' | undefined
    const readyForPublishing = searchParams.get('readyForPublishing') === 'true' ? true : 
                               searchParams.get('readyForPublishing') === 'false' ? false : undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const isArchived = searchParams.get('archived') === 'true'

    // Build where clause with proper visibility rules
    const where: Prisma.AssetWhereInput = {
      isArchived,
      ...(type && { type }),
      ...(category && { category }),
      ...(company && { company }),
      ...(eventName && { eventName }),
      ...(readyForPublishing !== undefined && { readyForPublishing }),
      ...(tags && tags.length > 0 && {
        tags: {
          some: {
            tag: {
              slug: { in: tags },
            },
          },
        },
      }),
    }

    // Apply search filter if provided
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Apply visibility rules
    if (usage) {
      // If user explicitly filters by usage, respect that filter
      where.usage = usage === 'public' ? UsageType.PUBLIC : UsageType.INTERNAL
      // But still apply publishing rules for public assets
      if (usage === 'public') {
        where.readyForPublishing = true
      }
    } else {
      // Apply default visibility rules when no explicit usage filter
      if (!isAuthenticated) {
        // Unauthenticated users: only public assets ready for publishing
        where.usage = UsageType.PUBLIC
        where.readyForPublishing = true
      } else {
        // Authenticated users: combine visibility rules with search if needed
        const visibilityRules = [
          {
            usage: UsageType.PUBLIC,
            readyForPublishing: true,
          },
          {
            usage: UsageType.INTERNAL,
          },
        ]

        if (search) {
          // Combine search and visibility rules
          where.AND = [
            {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
              ],
            },
            {
              OR: visibilityRules,
            },
          ]
          // Remove the simple OR from search since we're using AND now
          delete where.OR
        } else {
          // Just apply visibility rules
          where.OR = visibilityRules
        }
      }
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

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Assets API Query:', {
        isAuthenticated,
        userEmail: user?.email || 'anonymous',
        filters: { page, limit, search, type, usage },
        totalFound: 'will be calculated...'
      })
    }

    // Execute queries in parallel
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          filename: true,
          originalFilename: true,
          fileKey: true,
          thumbnailKey: true,
          previewKey: true,
          fileSize: true,
          mimeType: true,
          format: true,
          type: true,
          category: true,
          eventName: true,
          company: true,
          project: true,
          campaign: true,
          productionYear: true,
          width: true,
          height: true,
          duration: true,
          usage: true,
          readyForPublishing: true,
          isArchived: true,
          viewCount: true,
          downloadCount: true,
          createdAt: true,
          updatedAt: true,
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Found ${total} assets, returning ${assets.length}`)
      console.log('🔍 First asset details:', assets[0] ? {
        id: assets[0].id,
        title: assets[0].title,
        type: assets[0].type,
        usage: assets[0].usage,
        readyForPublishing: assets[0].readyForPublishing,
        thumbnailUrl: (assets[0] as any).thumbnailUrl
      } : 'No assets')
    }

    // Get S3 configuration for URL generation
    const bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME
    const region = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1'
    
    // Transform the response
    const transformedAssets = assets.map(asset => ({
      ...asset,
      fileSize: asset.fileSize.toString(), // Convert BigInt
      thumbnailUrl: asset.thumbnailKey 
        ? `https://${bucketName}.s3.${region}.amazonaws.com/${asset.thumbnailKey}`
        : asset.fileKey 
          ? `https://${bucketName}.s3.${region}.amazonaws.com/${asset.fileKey}`
          : '/placeholder.jpg', // Fallback placeholder
      tags: asset.tags.map(at => at.tag),
      favoriteCount: asset._count.favorites,
      collectionCount: asset._count.collections,
      downloadCount: asset._count.downloads,
    }))

    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Returning response:', {
        assetsCount: transformedAssets.length,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        firstAsset: transformedAssets[0] ? {
          id: transformedAssets[0].id,
          title: transformedAssets[0].title,
          thumbnail: transformedAssets[0].thumbnailUrl
        } : 'None'
      })
    }

    return successResponse(
      transformedAssets,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    )
  } catch (error) {
    console.error('Get assets error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch assets')
  }
}