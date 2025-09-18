import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

// POST /api/assets/:id/submit-review - Submit asset for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        uploadedBy: true,
        reviews: {
          where: {
            status: 'PENDING'
          }
        }
      }
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset not found')
    }

    // Check if user owns the asset or is a content manager/admin
    if (asset.uploadedById !== user!.id && 
        user!.role !== UserRole.CONTENT_MANAGER && 
        user!.role !== UserRole.ADMIN) {
      return ApiErrors.FORBIDDEN()
    }

    // Check if there's already a pending review
    if (asset.reviews.length > 0) {
      return ApiErrors.VALIDATION_ERROR('Asset already has a pending review')
    }

    // Find an available reviewer (user with REVIEWER role or higher)
    // In a real system, you might have more sophisticated assignment logic
    const availableReviewers = await prisma.user.findMany({
      where: {
        OR: [
          { role: UserRole.REVIEWER },
          { role: UserRole.CONTENT_MANAGER },
          { role: UserRole.ADMIN }
        ],
        // Don't assign to the uploader
        NOT: {
          id: asset.uploadedById
        }
      },
      orderBy: {
        // Simple load balancing - assign to reviewer with fewest pending reviews
        reviews: {
          _count: 'asc'
        }
      },
      take: 1
    })

    if (availableReviewers.length === 0) {
      return ApiErrors.SERVER_ERROR('No reviewers available')
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        assetId: asset.id,
        reviewerId: availableReviewers[0].id,
        status: 'PENDING',
        comments: 'Asset submitted for review'
      },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            email: true
          }
        }
      }
    })

    // Update asset status
    await prisma.asset.update({
      where: { id },
      data: {
        processingStatus: 'REVIEWING'
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_SUBMITTED_FOR_REVIEW',
        description: `Submitted "${asset.title}" for review`,
        userId: user!.id,
        assetId: asset.id,
        metadata: {
          reviewId: review.id,
          reviewerId: review.reviewerId
        }
      }
    })

    // Create notification for the reviewer
    await prisma.notification.create({
      data: {
        userId: review.reviewerId,
        type: 'REVIEW_ASSIGNED',
        title: 'New asset to review',
        message: `You have been assigned to review "${asset.title}"`,
        metadata: {
          assetId: asset.id,
          reviewId: review.id,
          submittedBy: user!.name || user!.email
        }
      }
    })

    return successResponse({
      reviewId: review.id,
      status: review.status,
      reviewer: review.reviewer,
      submittedAt: review.createdAt,
      message: 'Asset submitted for review successfully'
    })
  } catch (error) {
    console.error('Submit review error:', error)
    return ApiErrors.SERVER_ERROR('Failed to submit asset for review')
  }
}