import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// POST /api/reviews/:id/reject - Reject asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Parse request body
    const body = await request.json()
    const { comments, reasons } = body

    if (!comments || !reasons || reasons.length === 0) {
      return ApiErrors.VALIDATION_ERROR('Comments and reasons are required for rejection')
    }

    // Get review
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        asset: {
          include: {
            uploadedBy: true
          }
        },
        reviewer: true
      }
    })

    if (!review) {
      return ApiErrors.NOT_FOUND('Review not found')
    }

    // Check if user is the assigned reviewer or admin
    if (review.reviewerId !== user!.id && !hasPermission(user!, 'manage_all_assets')) {
      return ApiErrors.FORBIDDEN()
    }

    // Check if review is still pending
    if (review.status !== 'PENDING') {
      return ApiErrors.VALIDATION_ERROR(`Review is already ${review.status.toLowerCase()}`)
    }

    // Update review status
    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status: 'REJECTED',
        comments: `${comments}\n\nReasons: ${reasons.join(', ')}`,
        updatedAt: new Date()
      }
    })

    // Update asset status
    await prisma.asset.update({
      where: { id: review.assetId },
      data: {
        processingStatus: 'FAILED',
        readyForPublishing: false
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_REJECTED',
        description: `Rejected asset "${review.asset.title}"`,
        userId: user!.id,
        assetId: review.assetId,
        metadata: {
          reviewId: review.id,
          comments,
          reasons
        }
      }
    })

    // Create notification for the uploader
    await prisma.notification.create({
      data: {
        userId: review.asset.uploadedById,
        type: 'REVIEW_COMPLETED',
        title: 'Asset rejected',
        message: `Your asset "${review.asset.title}" has been rejected`,
        metadata: {
          assetId: review.assetId,
          reviewId: review.id,
          status: 'REJECTED',
          reviewerName: user!.name || user!.email,
          comments,
          reasons
        }
      }
    })

    return successResponse({
      id: updatedReview.id,
      status: updatedReview.status,
      comments: updatedReview.comments,
      updatedAt: updatedReview.updatedAt,
      message: 'Asset rejected'
    })
  } catch (error) {
    console.error('Reject review error:', error)
    return ApiErrors.SERVER_ERROR('Failed to reject review')
  }
}