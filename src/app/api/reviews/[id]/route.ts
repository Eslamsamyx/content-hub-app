import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

// GET /api/reviews/:id - Get review details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Get review with full details
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        asset: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true
              }
            },
            tags: {
              include: {
                tag: true
              }
            },
            variants: true,
            reviews: {
              orderBy: {
                createdAt: 'desc'
              },
              include: {
                reviewer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: {
                collections: true,
                favorites: true,
                downloads: true
              }
            }
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        }
      }
    })

    if (!review) {
      return ApiErrors.NOT_FOUND('Review not found')
    }

    // Check if user has access to this review
    const isReviewer = review.reviewerId === user!.id
    const isUploader = review.asset.uploadedById === user!.id
    const isAdmin = hasPermission(user!, 'manage_all_assets')

    if (!isReviewer && !isUploader && !isAdmin) {
      return ApiErrors.FORBIDDEN()
    }

    // Generate URLs for assets
    const [thumbnailUrl, previewUrl, downloadUrl] = await Promise.all([
      review.asset.thumbnailKey 
        ? getDownloadUrl(review.asset.thumbnailKey, undefined, 3600)
        : null,
      review.asset.previewKey
        ? getDownloadUrl(review.asset.previewKey, undefined, 3600)
        : null,
      getDownloadUrl(review.asset.fileKey, review.asset.filename, 3600)
    ])

    // Generate variant URLs
    const variantsWithUrls = await Promise.all(
      review.asset.variants.map(async (variant) => ({
        ...variant,
        fileSize: variant.fileSize.toString(),
        url: await getDownloadUrl(variant.fileKey, undefined, 3600)
      }))
    )

    return successResponse({
      id: review.id,
      status: review.status,
      comments: review.comments,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      reviewer: review.reviewer,
      asset: {
        id: review.asset.id,
        title: review.asset.title,
        description: review.asset.description,
        type: review.asset.type,
        category: review.asset.category,
        filename: review.asset.filename,
        fileSize: review.asset.fileSize.toString(),
        mimeType: review.asset.mimeType,
        format: review.asset.format,
        thumbnailUrl,
        previewUrl,
        downloadUrl,
        uploadedBy: review.asset.uploadedBy,
        uploadedAt: review.asset.createdAt,
        tags: review.asset.tags.map(at => ({
          id: at.tag.id,
          name: at.tag.name,
          slug: at.tag.slug,
          color: at.tag.color,
          category: at.tag.category
        })),
        variants: variantsWithUrls,
        metadata: {
          width: review.asset.width,
          height: review.asset.height,
          duration: review.asset.duration,
          company: review.asset.company,
          eventName: review.asset.eventName,
          project: review.asset.project,
          campaign: review.asset.campaign,
          productionYear: review.asset.productionYear,
          usage: review.asset.usage,
          readyForPublishing: review.asset.readyForPublishing
        },
        stats: {
          collectionCount: review.asset._count.collections,
          favoriteCount: review.asset._count.favorites,
          downloadCount: review.asset._count.downloads
        },
        reviewHistory: review.asset.reviews.map(r => ({
          id: r.id,
          status: r.status,
          comments: r.comments,
          reviewer: r.reviewer,
          createdAt: r.createdAt
        }))
      }
    })
  } catch (error) {
    console.error('Get review details error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch review details')
  }
}