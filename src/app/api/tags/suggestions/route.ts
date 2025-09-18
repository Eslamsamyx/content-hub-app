import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { TagCategory } from '@prisma/client'

// GET /api/tags/suggestions - Get tag suggestions based on content
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
    const query = searchParams.get('q') || ''
    const assetType = searchParams.get('type')
    const category = searchParams.get('category')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (!query || query.length < 2) {
      return ApiErrors.VALIDATION_ERROR('Query must be at least 2 characters')
    }

    // Get tag suggestions based on partial match
    const suggestions = await prisma.tag.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
        ],
        ...(category && { category: category as TagCategory }),
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        color: true,
        usageCount: true,
      },
    })

    // If searching for specific asset type, get commonly used tags for that type
    if (assetType && suggestions.length < limit) {
      const commonTags = await prisma.tag.findMany({
        where: {
          isActive: true,
          assets: {
            some: {
              asset: {
                type: assetType as any,
              },
            },
          },
          NOT: {
            id: { in: suggestions.map(s => s.id) },
          },
        },
        orderBy: { usageCount: 'desc' },
        take: limit - suggestions.length,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          color: true,
          usageCount: true,
        },
      })

      suggestions.push(...commonTags)
    }

    return successResponse({ suggestions })
  } catch (error) {
    console.error('Get tag suggestions error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch tag suggestions')
  }
}

// POST /api/tags/suggestions - Generate AI-based tag suggestions (placeholder for future implementation)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'tag.read')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const { assetType } = body

    // For now, return popular tags based on asset type
    // In the future, this could use AI to analyze content
    const popularTags = await prisma.tag.findMany({
      where: {
        isActive: true,
        ...(assetType && {
          assets: {
            some: {
              asset: {
                type: assetType,
              },
            },
          },
        }),
      },
      orderBy: { usageCount: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        color: true,
      },
    })

    // Add some basic suggestions based on content
    const suggestions = [...popularTags]
    
    // Add type-specific suggestions
    if (assetType === 'IMAGE') {
      const imageTags = ['photography', 'graphic', 'illustration', 'photo'].map(name => ({
        id: `suggested-${name}`,
        name,
        slug: name,
        category: 'ASSET_TYPE' as const,
        color: '#8B5CF6',
      }))
      suggestions.push(...imageTags.filter(t => 
        !suggestions.some(s => s.slug === t.slug)
      ))
    }

    return successResponse({ 
      suggestions: suggestions.slice(0, 15),
      message: 'AI-based suggestions coming soon. Showing popular tags for now.',
    })
  } catch (error) {
    console.error('Generate tag suggestions error:', error)
    return ApiErrors.SERVER_ERROR('Failed to generate tag suggestions')
  }
}