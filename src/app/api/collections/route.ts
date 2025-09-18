import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/collections - List user's collections
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'collection.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const isPublic = searchParams.get('isPublic') === 'true' ? true : 
                    searchParams.get('isPublic') === 'false' ? false : undefined
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'updatedAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const createdByMe = searchParams.get('createdByMe') === 'true'

    // Build where clause
    const where: Prisma.CollectionWhereInput = {
      ...(createdByMe && { createdById: user!.id }),
      ...(isPublic !== undefined && { isPublic }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }
    
    console.log('GET Collections - Query params:', {
      createdByMe,
      isPublic,
      search,
      userId: user?.id,
      where
    })

    // Build orderBy
    const orderBy: Prisma.CollectionOrderByWithRelationInput = {}
    if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder
    } else if (sortBy === 'isPinned') {
      orderBy.isPinned = sortOrder === 'asc' ? 'desc' : 'asc' // Pinned first
    } else {
      orderBy.updatedAt = sortOrder
    }

    // Execute queries
    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' }, // Always show pinned first
          orderBy,
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              assets: true,
            },
          },
          assets: {
            take: 1,
            orderBy: { addedAt: 'desc' },
            include: {
              asset: {
                select: {
                  thumbnailKey: true,
                },
              },
            },
          },
        },
      }),
      prisma.collection.count({ where }),
    ])
    
    console.log('GET Collections - Found:', {
      collectionsCount: collections.length,
      totalCount: total,
      collections: collections.map(c => ({ id: c.id, name: c.name, createdById: c.createdById }))
    })

    // Transform response
    const transformedCollections = await Promise.all(
      collections.map(async (collection) => {
        // Get cover image URL if available
        let coverImageUrl = null
        if (collection.coverImage) {
          const { getDownloadUrl } = await import('@/lib/s3')
          coverImageUrl = await getDownloadUrl(collection.coverImage, undefined, 3600)
        } else if (collection.assets[0]?.asset.thumbnailKey) {
          // Use first asset's thumbnail as cover
          const { getDownloadUrl } = await import('@/lib/s3')
          coverImageUrl = await getDownloadUrl(
            collection.assets[0].asset.thumbnailKey,
            undefined,
            3600
          )
        }

        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          coverImage: coverImageUrl,
          isPublic: collection.isPublic,
          isPinned: collection.isPinned,
          itemCount: collection._count.assets,
          createdBy: collection.createdBy,
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
        }
      })
    )

    console.log('GET Collections - Returning:', {
      transformedCount: transformedCollections.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
    
    return successResponse(
      transformedCollections,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    )
  } catch (error) {
    console.error('Get collections error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch collections')
  }
}

// POST /api/collections - Create collection
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'collection.create')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const { name, description, isPublic } = body
    
    console.log('POST Collection - Creating with:', {
      name,
      description,
      isPublic,
      userId: user?.id
    })

    // Validate required fields
    if (!name) {
      return ApiErrors.VALIDATION_ERROR('Name is required')
    }

    // Create collection
    const collection = await prisma.collection.create({
      data: {
        name,
        description,
        isPublic: isPublic || false,
        createdById: user!.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    })

    console.log('Collection created successfully:', collection)
    
    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'COLLECTION_CREATED',
        description: `Created collection "${name}"`,
        userId: user!.id,
        collectionId: collection.id,
      },
    })

    const responseData = {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      coverImage: null,
      isPublic: collection.isPublic,
      isPinned: collection.isPinned,
      itemCount: 0,
      createdBy: collection.createdBy,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }
    
    console.log('Returning response:', responseData)
    
    return successResponse(responseData, undefined, 201)
  } catch (error) {
    console.error('Create collection error:', error)
    return ApiErrors.SERVER_ERROR('Failed to create collection')
  }
}