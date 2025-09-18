import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { searchService } from '@/lib/search-service'

// GET /api/search/suggestions - Search autocomplete
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    // Validate query
    if (!query || query.length < 2) {
      return ApiErrors.VALIDATION_ERROR('Query must be at least 2 characters')
    }

    // Get suggestions
    const suggestions = await searchService.getSuggestions(query, limit)

    // Add recent searches from user's activity (if available)
    const recentSearches = await getRecentSearches(user!.id, query, 5)
    
    // Combine and deduplicate suggestions
    const combinedSuggestions = [
      ...recentSearches,
      ...suggestions.filter(s => 
        !recentSearches.some(r => r.value === s.value && r.type === s.type)
      ),
    ].slice(0, limit)

    return successResponse({
      query,
      suggestions: combinedSuggestions,
      total: combinedSuggestions.length,
    })
  } catch (error) {
    console.error('Search suggestions error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch suggestions')
  }
}

// Helper function to get recent searches from user activity
async function getRecentSearches(userId: string, query: string, limit: number) {
  const { prisma } = await import('@/lib/prisma')
  
  // First, try to get matching queries from search history
  const searchHistory = await prisma.searchHistory.findMany({
    where: {
      userId,
      query: { contains: query, mode: 'insensitive' },
    },
    select: {
      query: true,
      resultCount: true,
    },
    orderBy: { createdAt: 'desc' },
    take: Math.floor(limit / 2),
    distinct: ['query'],
  })

  const historySuggestions = searchHistory.map(h => ({
    type: 'recent' as const,
    value: h.query,
    label: h.query,
    count: h.resultCount,
  }))

  // Also get recently viewed assets as suggestions
  const recentActivities = await prisma.activity.findMany({
    where: {
      userId,
      type: 'ASSET_VIEWED',
      asset: {
        title: { contains: query, mode: 'insensitive' },
      },
    },
    select: {
      asset: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit - historySuggestions.length,
    distinct: ['assetId'],
  })

  const assetSuggestions = recentActivities
    .filter(a => a.asset)
    .map(a => ({
      type: 'recent' as const,
      id: a.asset!.id,
      value: a.asset!.title,
      meta: `Recently viewed • ${a.asset!.type}`,
    }))

  return [...historySuggestions, ...assetSuggestions]
}