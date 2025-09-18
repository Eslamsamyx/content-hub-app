import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

// GET /api/reviews/pending - Get pending reviews for current reviewer
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check if user has reviewer permissions
    const canReview = hasPermission(user!, 'asset.review')
    if (!canReview) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const where = {
      reviewerId: user!.id,
      status: 'PENDING' as const
    }

    // Get total count
    const total = await prisma.review.count({ where })

    // Get reviews with asset details
    const reviews = await prisma.review.findMany({
      where,
      include: {
        asset: {
          include: {
            uploadedBy: {
              select: {
                id: true,
            firstName: true,
                email: true,
                avatar: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            },
            _count: {
              select: {
                reviews: true,
                downloads: true
              }
            }
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: (page - 1) * limit,
      take: limit
    })

    // Generate URLs for assets
    const reviewsWithUrls = await Promise.all(
      reviews.map(async (review) => {
        const thumbnailUrl = review.asset.thumbnailKey 
          ? await getDownloadUrl(review.asset.thumbnailKey, undefined, 3600)
          : null

        const previewUrl = review.asset.previewKey
          ? await getDownloadUrl(review.asset.previewKey, undefined, 3600)
          : null

        return {
          id: review.id,
          status: review.status,
          comments: review.comments,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
          asset: {
            id: review.asset.id,
            title: review.asset.title,
            description: review.asset.description,
            type: review.asset.type,
            category: review.asset.category,
            fileSize: review.asset.fileSize.toString(),
            mimeType: review.asset.mimeType,
            thumbnailUrl,
            previewUrl,
            uploadedBy: review.asset.uploadedBy,
            uploadedAt: review.asset.createdAt,
            tags: review.asset.tags.map(at => ({
              id: at.tag.id,
              name: at.tag.name,
              slug: at.tag.slug,
              color: at.tag.color
            })),
            stats: {
              reviewCount: review.asset._count.reviews,
              downloadCount: review.asset._count.downloads
            },
            metadata: {
              width: review.asset.width,
              height: review.asset.height,
              duration: review.asset.duration,
              company: review.asset.company,
              eventName: review.asset.eventName,
              project: review.asset.project,
              campaign: review.asset.campaign,
              productionYear: review.asset.productionYear
            }
          }
        }
      })
    )

    return successResponse({
      reviews: reviewsWithUrls,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get pending reviews error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch pending reviews')
  }
}