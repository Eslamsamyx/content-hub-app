import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { TagCategory, Prisma } from '@prisma/client'

// GET /api/tags - List all tags with categories
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'tag.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as TagCategory | undefined
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const includeEmpty = searchParams.get('includeEmpty') === 'true'

    // Build where clause
    const where: Prisma.TagWhereInput = {
      isActive: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(!includeEmpty && { usageCount: { gt: 0 } }),
    }

    // Get tags
    const tags = await prisma.tag.findMany({
      where,
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
      include: {
        _count: {
          select: { assets: true },
        },
      },
    })

    // Group by category if no specific category requested
    if (!category) {
      const groupedTags = tags.reduce((acc, tag) => {
        if (!acc[tag.category]) {
          acc[tag.category] = []
        }
        acc[tag.category].push({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
          description: tag.description,
          usageCount: tag._count.assets,
        })
        return acc
      }, {} as Record<string, any[]>)

      return successResponse({ tags: groupedTags, total: tags.length })
    }

    // Return flat list if specific category requested
    const transformedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
      color: tag.color,
      description: tag.description,
      usageCount: tag._count.assets,
    }))

    return successResponse({ tags: transformedTags, total: tags.length })
  } catch (error) {
    console.error('Get tags error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch tags')
  }
}

// POST /api/tags - Create new tag
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'tag.create')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const { name, category, color, description } = body

    // Validate required fields
    if (!name || !category) {
      return ApiErrors.VALIDATION_ERROR('Name and category are required')
    }

    // Validate category
    if (!Object.values(TagCategory).includes(category)) {
      return ApiErrors.VALIDATION_ERROR('Invalid tag category')
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    })

    if (existingTag) {
      return ApiErrors.VALIDATION_ERROR('Tag with this name already exists')
    }

    // Create tag
    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        category,
        color,
        description,
      },
    })

    return successResponse(tag, undefined, 201)
  } catch (error) {
    console.error('Create tag error:', error)
    return ApiErrors.SERVER_ERROR('Failed to create tag')
  }
}