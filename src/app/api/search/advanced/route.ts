import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { searchService, SearchFilters } from '@/lib/search-service'
import { AssetType } from '@prisma/client'

interface AdvancedSearchRequest {
  query?: string
  filters: {
    // Basic filters
    types?: AssetType[]
    categories?: string[]
    tags?: string[]
    
    // User/ownership filters
    uploadedBy?: string[]
    
    // Content filters
    companies?: string[]
    eventNames?: string[]
    projects?: string[]
    campaigns?: string[]
    
    // Date range filters
    createdDate?: {
      from?: string
      to?: string
    }
    modifiedDate?: {
      from?: string
      to?: string
    }
    
    // Technical filters
    fileSize?: {
      min?: number
      max?: number
      unit?: 'bytes' | 'KB' | 'MB' | 'GB'
    }
    dimensions?: {
      width?: { min?: number; max?: number }
      height?: { min?: number; max?: number }
      aspectRatio?: string // e.g., "16:9", "4:3"
    }
    duration?: {
      min?: number
      max?: number
      unit?: 'seconds' | 'minutes' | 'hours'
    }
    
    // Quality/status filters
    hasMetadata?: boolean
    hasVariants?: boolean
    processingStatus?: string[]
    readyForPublishing?: boolean
    visibility?: ('internal' | 'external')[]
    usage?: ('internal' | 'public')[]
    
    // Collection filters
    inCollections?: string[]
    notInCollections?: boolean
    
    // Advanced text search
    textSearch?: {
      fields?: ('title' | 'description' | 'filename' | 'tags')[]
      operator?: 'AND' | 'OR'
      caseSensitive?: boolean
    }
  }
  
  // Sorting options
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }[]
  
  // Pagination
  page?: number
  limit?: number
  
  // Response options
  includeStats?: boolean
  includeFacets?: boolean
  groupBy?: string
}

// POST /api/search/advanced - Advanced search with complex filters
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body: AdvancedSearchRequest = await request.json()
    const {
      query = '',
      filters = {},
      sort = [{ field: 'relevance', order: 'desc' }],
      page = 1,
      limit = 20,
      includeStats = false,
      includeFacets = true,
      groupBy,
    } = body

    // Convert file size to bytes if needed
    let fileSizeFilter: SearchFilters['fileSize']
    if (filters.fileSize) {
      const multipliers = {
        bytes: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
      }
      const multiplier = multipliers[filters.fileSize.unit || 'bytes']
      fileSizeFilter = {
        min: filters.fileSize.min ? filters.fileSize.min * multiplier : undefined,
        max: filters.fileSize.max ? filters.fileSize.max * multiplier : undefined,
      }
    }

    // Convert duration to seconds
    let durationFilter: SearchFilters['duration']
    if (filters.duration) {
      const multipliers = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
      }
      const multiplier = multipliers[filters.duration.unit || 'seconds']
      durationFilter = {
        min: filters.duration.min ? filters.duration.min * multiplier : undefined,
        max: filters.duration.max ? filters.duration.max * multiplier : undefined,
      }
    }

    // Calculate aspect ratio dimensions if provided
    let dimensionsFilter: SearchFilters['dimensions']
    if (filters.dimensions) {
      dimensionsFilter = {
        minWidth: filters.dimensions.width?.min,
        maxWidth: filters.dimensions.width?.max,
        minHeight: filters.dimensions.height?.min,
        maxHeight: filters.dimensions.height?.max,
      }
      
      // Handle aspect ratio
      if (filters.dimensions.aspectRatio) {
        // Aspect ratio filtering would be implemented here
        // This is simplified - in production you'd want more sophisticated aspect ratio filtering
      }
    }

    // Build search filters
    const searchFilters: SearchFilters = {
      types: filters.types,
      categories: filters.categories,
      tags: filters.tags,
      users: filters.uploadedBy,
      companies: filters.companies,
      eventNames: filters.eventNames,
      usage: filters.usage,
      readyForPublishing: filters.readyForPublishing,
      hasVariants: filters.hasVariants,
      fileSize: fileSizeFilter,
      dimensions: dimensionsFilter,
      duration: durationFilter,
      dateFrom: filters.createdDate?.from ? new Date(filters.createdDate.from) : undefined,
      dateTo: filters.createdDate?.to ? new Date(filters.createdDate.to) : undefined,
    }

    // Perform search
    const results = await searchService.search(
      {
        query,
        filters: searchFilters,
        searchIn: ['assets'], // Advanced search focuses on assets
        sortBy: sort[0]?.field || 'relevance',
        sortOrder: sort[0]?.order || 'desc',
        page,
        limit,
      },
      user!.id
    )

    // Get additional statistics if requested
    let stats = null
    if (includeStats) {
      stats = await getSearchStatistics(searchFilters, query)
    }

    // Group results if requested
    let groupedResults = null
    if (groupBy && results.assets.length > 0) {
      groupedResults = groupAssetsByField(results.assets, groupBy)
    }

    // Generate URLs for assets
    if (results.assets.length > 0) {
      const { getDownloadUrl } = await import('@/lib/s3')
      results.assets = await Promise.all(
        results.assets.map(async (asset) => ({
          ...asset,
          thumbnailUrl: asset.thumbnailKey 
            ? await getDownloadUrl(asset.thumbnailKey, undefined, 3600)
            : null,
        }))
      )
    }

    return successResponse({
      query,
      filters: body.filters,
      results: groupedResults || results.assets,
      total: results.total.assets,
      ...(includeFacets && { facets: results.facets }),
      ...(includeStats && { statistics: stats }),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(results.total.assets / limit),
      },
    })
  } catch (error) {
    console.error('Advanced search error:', error)
    return ApiErrors.SERVER_ERROR('Failed to perform advanced search')
  }
}

// Helper function to get search statistics
async function getSearchStatistics(filters: SearchFilters, query: string) {
  const { prisma } = await import('@/lib/prisma')
  
  const baseWhere = {
    isArchived: false,
    ...(query && {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { description: { contains: query, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [
    totalSize,
    avgFileSize,
    dateRange,
    typeDistribution,
  ] = await Promise.all([
    // Total file size
    prisma.asset.aggregate({
      where: baseWhere,
      _sum: { fileSize: true },
    }),
    // Average file size
    prisma.asset.aggregate({
      where: baseWhere,
      _avg: { fileSize: true },
    }),
    // Date range
    prisma.asset.aggregate({
      where: baseWhere,
      _min: { createdAt: true },
      _max: { createdAt: true },
    }),
    // Type distribution
    prisma.asset.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: true,
    }),
  ])

  return {
    totalFileSize: totalSize._sum.fileSize?.toString() || '0',
    averageFileSize: avgFileSize._avg.fileSize?.toString() || '0',
    dateRange: {
      earliest: dateRange._min.createdAt,
      latest: dateRange._max.createdAt,
    },
    typeDistribution: typeDistribution.map(t => ({
      type: t.type,
      count: t._count,
    })),
  }
}

// Helper function to group assets by field
function groupAssetsByField(assets: any[], field: string) {
  const grouped: Record<string, any[]> = {}
  
  for (const asset of assets) {
    const key = asset[field] || 'Other'
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(asset)
  }
  
  return Object.entries(grouped).map(([key, items]) => ({
    group: key,
    count: items.length,
    assets: items,
  }))
}