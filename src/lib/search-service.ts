import { prisma } from '@/lib/prisma'
import { Prisma, AssetType } from '@prisma/client'

export interface SearchFilters {
  types?: AssetType[]
  categories?: string[]
  tags?: string[]
  users?: string[]
  dateFrom?: Date
  dateTo?: Date
  fileSize?: {
    min?: number
    max?: number
  }
  dimensions?: {
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
  }
  duration?: {
    min?: number
    max?: number
  }
  companies?: string[]
  eventNames?: string[]
  usage?: ('internal' | 'public')[]
  readyForPublishing?: boolean
  hasVariants?: boolean
}

export interface SearchOptions {
  query?: string
  filters?: SearchFilters
  searchIn?: ('assets' | 'collections' | 'tags')[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SearchResult {
  assets: any[]
  collections: any[]
  tags: any[]
  total: {
    assets: number
    collections: number
    tags: number
  }
  facets?: {
    types: { value: string; count: number }[]
    categories: { value: string; count: number }[]
    tags: { value: string; count: number }[]
  }
}

export class SearchService {
  async search(options: SearchOptions, userId: string | null): Promise<SearchResult> {
    const {
      query = '',
      filters = {},
      searchIn = ['assets', 'collections', 'tags'],
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options

    const results: SearchResult = {
      assets: [],
      collections: [],
      tags: [],
      total: {
        assets: 0,
        collections: 0,
        tags: 0,
      },
    }

    // Search in assets
    if (searchIn.includes('assets')) {
      const assetResults = await this.searchAssets(query, filters, sortBy, sortOrder, page, limit)
      results.assets = assetResults.items
      results.total.assets = assetResults.total
    }

    // Search in collections
    if (searchIn.includes('collections')) {
      const collectionResults = await this.searchCollections(query, userId, page, limit)
      results.collections = collectionResults.items
      results.total.collections = collectionResults.total
    }

    // Search in tags
    if (searchIn.includes('tags')) {
      const tagResults = await this.searchTags(query, page, limit)
      results.tags = tagResults.items
      results.total.tags = tagResults.total
    }

    // Generate facets if searching assets
    if (searchIn.includes('assets') && results.assets.length > 0) {
      results.facets = await this.generateFacets(query, filters)
    }

    return results
  }

  private async searchAssets(
    query: string,
    filters: SearchFilters,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    page: number,
    limit: number
  ) {
    const where: Prisma.AssetWhereInput = {
      isArchived: false,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { originalFilename: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
          { project: { contains: query, mode: 'insensitive' } },
          { eventName: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(filters.types && { type: { in: filters.types } }),
      ...(filters.categories && { category: { in: filters.categories } }),
      ...(filters.companies && { company: { in: filters.companies } }),
      ...(filters.eventNames && { eventName: { in: filters.eventNames } }),
      ...(filters.usage && { 
        usage: { 
          in: filters.usage.map(u => u === 'internal' ? 'INTERNAL' : 'PUBLIC') as any 
        } 
      }),
      ...(filters.readyForPublishing !== undefined && { readyForPublishing: filters.readyForPublishing }),
      ...(filters.tags && filters.tags.length > 0 && {
        tags: {
          some: {
            tag: {
              slug: { in: filters.tags },
            },
          },
        },
      }),
      ...(filters.users && {
        uploadedById: { in: filters.users },
      }),
      ...((filters.dateFrom || filters.dateTo) && {
        createdAt: {
          ...(filters.dateFrom && { gte: filters.dateFrom }),
          ...(filters.dateTo && { lte: filters.dateTo }),
        },
      }),
      ...(filters.fileSize && {
        fileSize: {
          ...(filters.fileSize.min !== undefined && { gte: BigInt(filters.fileSize.min) }),
          ...(filters.fileSize.max !== undefined && { lte: BigInt(filters.fileSize.max) }),
        },
      }),
      ...(filters.dimensions && {
        AND: [
          ...(filters.dimensions.minWidth ? [{ width: { gte: filters.dimensions.minWidth } }] : []),
          ...(filters.dimensions.maxWidth ? [{ width: { lte: filters.dimensions.maxWidth } }] : []),
          ...(filters.dimensions.minHeight ? [{ height: { gte: filters.dimensions.minHeight } }] : []),
          ...(filters.dimensions.maxHeight ? [{ height: { lte: filters.dimensions.maxHeight } }] : []),
        ],
      }),
      ...(filters.duration && {
        duration: {
          ...(filters.duration.min && { gte: filters.duration.min }),
          ...(filters.duration.max && { lte: filters.duration.max }),
        },
      }),
      ...(filters.hasVariants && {
        variants: {
          some: {},
        },
      }),
    }

    // Build orderBy
    let orderBy: any = {}
    if (sortBy === 'relevance' && query) {
      // For relevance sorting, we'll use multiple order criteria
      orderBy = [
        // Exact title match first
        { title: sortOrder },
        { createdAt: 'desc' },
      ]
    } else if (sortBy === 'date') {
      orderBy = { createdAt: sortOrder }
    } else if (sortBy === 'title') {
      orderBy = { title: sortOrder }
    } else if (sortBy === 'size') {
      orderBy = { fileSize: sortOrder }
    } else if (sortBy === 'views') {
      orderBy = { viewCount: sortOrder }
    } else if (sortBy === 'downloads') {
      orderBy = { downloadCount: sortOrder }
    } else {
      orderBy = { createdAt: sortOrder }
    }

    const [items, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
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

    return {
      items: items.map(asset => ({
        ...asset,
        fileSize: asset.fileSize.toString(),
        tags: asset.tags.map(at => at.tag),
      })),
      total,
    }
  }

  private async searchCollections(query: string, userId: string | null, page: number, limit: number) {
    const where: Prisma.CollectionWhereInput = {
      OR: [
        { isPublic: true },
        ...(userId ? [{ createdById: userId }] : []),
      ],
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          { updatedAt: 'desc' },
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
        },
      }),
      prisma.collection.count({ where }),
    ])

    return { items, total }
  }

  private async searchTags(query: string, page: number, limit: number) {
    const where: Prisma.TagWhereInput = {
      isActive: true,
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
    }

    const [items, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        orderBy: { usageCount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { assets: true },
          },
        },
      }),
      prisma.tag.count({ where }),
    ])

    return {
      items: items.map(tag => ({
        ...tag,
        assetCount: tag._count.assets,
      })),
      total,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async generateFacets(query: string, filters: SearchFilters) {
    // Get base where clause without specific filters to show all options
    const baseWhere: Prisma.AssetWhereInput = {
      isArchived: false,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
    }

    // Get type facets
    const typeFacets = await prisma.asset.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { type: 'desc' } },
    })

    // Get category facets
    const categoryFacets = await prisma.asset.groupBy({
      by: ['category'],
      where: baseWhere,
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    })

    // Get top tags
    const tagFacets = await prisma.tag.findMany({
      where: {
        assets: {
          some: {
            asset: baseWhere,
          },
        },
      },
      orderBy: { usageCount: 'desc' },
      take: 20,
      select: {
        name: true,
        slug: true,
        _count: {
          select: { assets: true },
        },
      },
    })

    return {
      types: typeFacets.map(f => ({ value: f.type, count: f._count })),
      categories: categoryFacets.map(f => ({ value: f.category, count: f._count })),
      tags: tagFacets.map(t => ({ value: t.slug, count: t._count.assets })),
    }
  }

  async getSuggestions(query: string, limit: number = 10) {
    if (!query || query.length < 2) {
      return []
    }

    const suggestions: any[] = []

    // Get asset title suggestions
    const assetSuggestions = await prisma.asset.findMany({
      where: {
        isArchived: false,
        title: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
      take: Math.ceil(limit / 3),
    })

    suggestions.push(...assetSuggestions.map(a => ({
      type: 'asset',
      id: a.id,
      value: a.title,
      meta: a.type,
    })))

    // Get collection suggestions
    const collectionSuggestions = await prisma.collection.findMany({
      where: {
        isPublic: true,
        name: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
      },
      take: Math.ceil(limit / 3),
    })

    suggestions.push(...collectionSuggestions.map(c => ({
      type: 'collection',
      id: c.id,
      value: c.name,
    })))

    // Get tag suggestions
    const tagSuggestions = await prisma.tag.findMany({
      where: {
        isActive: true,
        name: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        usageCount: true,
      },
      orderBy: { usageCount: 'desc' },
      take: Math.ceil(limit / 3),
    })

    suggestions.push(...tagSuggestions.map(t => ({
      type: 'tag',
      id: t.id,
      value: t.name,
      meta: `${t.usageCount} uses`,
    })))

    return suggestions.slice(0, limit)
  }
}

export const searchService = new SearchService()