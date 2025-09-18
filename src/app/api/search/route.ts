import { NextRequest } from 'next/server'
import { optionalAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { searchService } from '@/lib/search-service'
import { AssetType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { enrichAssetsWithUrls } from '@/lib/s3-batch'

// GET /api/search - Global search endpoint (public with optional auth)
export async function GET(request: NextRequest) {
  try {
    // Optional authentication - public users can search public assets
    const userResult = await optionalAuth(request)
    const user = userResult?.user || null
    const isAuthenticated = !!user

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const searchIn = searchParams.get('in')?.split(',').filter(Boolean) as ('assets' | 'collections' | 'tags')[] || ['assets', 'collections', 'tags']
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const sortBy = searchParams.get('sortBy') || 'relevance'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    
    // Parse filters
    const types = searchParams.get('types')?.split(',').filter(Boolean) as AssetType[]
    const categories = searchParams.get('categories')?.split(',').filter(Boolean)
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const users = searchParams.get('users')?.split(',').filter(Boolean)
    const companies = searchParams.get('companies')?.split(',').filter(Boolean)
    const eventNames = searchParams.get('eventNames')?.split(',').filter(Boolean)
    const usageParam = searchParams.get('usage')?.split(',').filter(Boolean)
    const usage = usageParam?.filter(u => u === 'internal' || u === 'public') as ('internal' | 'public')[] | undefined
    const readyForPublishing = searchParams.get('readyForPublishing') === 'true' ? true : 
                              searchParams.get('readyForPublishing') === 'false' ? false : undefined
    const hasVariants = searchParams.get('hasVariants') === 'true'
    
    // Date filters
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
    
    // Size filters
    const fileSizeMin = searchParams.get('fileSizeMin') ? parseInt(searchParams.get('fileSizeMin')!) : undefined
    const fileSizeMax = searchParams.get('fileSizeMax') ? parseInt(searchParams.get('fileSizeMax')!) : undefined
    
    // Dimension filters
    const minWidth = searchParams.get('minWidth') ? parseInt(searchParams.get('minWidth')!) : undefined
    const maxWidth = searchParams.get('maxWidth') ? parseInt(searchParams.get('maxWidth')!) : undefined
    const minHeight = searchParams.get('minHeight') ? parseInt(searchParams.get('minHeight')!) : undefined
    const maxHeight = searchParams.get('maxHeight') ? parseInt(searchParams.get('maxHeight')!) : undefined
    
    // Duration filters (for video/audio)
    const durationMin = searchParams.get('durationMin') ? parseInt(searchParams.get('durationMin')!) : undefined
    const durationMax = searchParams.get('durationMax') ? parseInt(searchParams.get('durationMax')!) : undefined

    // Build filters object
    const filters = {
      ...(types && { types }),
      ...(categories && { categories }),
      ...(tags && { tags }),
      ...(users && { users }),
      ...(companies && { companies }),
      ...(eventNames && { eventNames }),
      ...(usage && { usage }),
      ...(readyForPublishing !== undefined && { readyForPublishing }),
      ...(hasVariants && { hasVariants }),
      ...(dateFrom || dateTo ? { dateFrom, dateTo } : {}),
      ...(fileSizeMin || fileSizeMax ? { fileSize: { min: fileSizeMin, max: fileSizeMax } } : {}),
      ...(minWidth || maxWidth || minHeight || maxHeight ? {
        dimensions: { minWidth, maxWidth, minHeight, maxHeight }
      } : {}),
      ...(durationMin || durationMax ? { duration: { min: durationMin, max: durationMax } } : {}),
      // For unauthenticated users, force public filter
      ...(!isAuthenticated && { usage: ['public' as const], readyForPublishing: true }),
    }

    // Perform search
    const results = await searchService.search(
      {
        query,
        filters,
        searchIn,
        sortBy,
        sortOrder,
        page,
        limit,
      },
      user?.id || null
    )

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

    // Store search history for authenticated users
    if (user && query.trim()) {
      try {
        await prisma.searchHistory.create({
          data: {
            userId: user.id,
            query: query.trim(),
            filters: Object.keys(filters).length > 0 ? filters : undefined,
            resultCount: results.assets.length + results.collections.length + results.tags.length,
            clickedAssets: [] // Will be updated when user clicks on results
          }
        })
      } catch (error) {
        // Don't fail the search if history fails to save
        console.error('Failed to save search history:', error)
      }
    }

    // Try to enrich assets with S3 URLs, but don't fail if S3 is not configured
    let enrichedAssets = results.assets
    try {
      if (process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET) {
        enrichedAssets = await enrichAssetsWithUrls(results.assets, ['thumbnail'])
      }
    } catch (enrichError) {
      console.warn('Could not enrich assets with S3 URLs:', enrichError)
      // Continue with unenriched assets
    }

    return successResponse(
      {
        query,
        results: {
          assets: enrichedAssets,
          collections: results.collections,
          tags: results.tags,
        },
        total: results.total,
        facets: results.facets,
      },
      {
        page,
        limit,
        totalResults: results.total.assets + results.total.collections + results.total.tags,
      }
    )
  } catch (error) {
    console.error('Search error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    })
    // Log to file for debugging
    import('fs').then(fs => {
      fs.appendFileSync('/tmp/search-debug.log', `${new Date().toISOString()} - Search error: ${JSON.stringify({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })}\n`)
    }).catch(fsError => {
      console.error('Failed to write to debug log:', fsError)
    })
    return ApiErrors.SERVER_ERROR('Failed to perform search')
  }
}