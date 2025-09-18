import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// POST /api/reviews/:id/request-changes - Request changes for asset
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
    const { comments, requiredChanges } = body

    if (!comments || !requiredChanges || requiredChanges.length === 0) {
      return ApiErrors.VALIDATION_ERROR('Comments and required changes are required')
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
        status: 'NEEDS_REVISION',
        comments: `${comments}\n\nRequired changes:\n${requiredChanges.map((change: string, i: number) => `${i + 1}. ${change}`).join('\n')}`,
        updatedAt: new Date()
      }
    })

    // Update asset status
    await prisma.asset.update({
      where: { id: review.assetId },
      data: {
        processingStatus: 'NEEDS_REVISION',
        readyForPublishing: false
      }
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'CHANGES_REQUESTED',
        description: `Requested changes for asset "${review.asset.title}"`,
        userId: user!.id,
        assetId: review.assetId,
        metadata: {
          reviewId: review.id,
          comments,
          requiredChanges
        }
      }
    })

    // Create notification for the uploader
    await prisma.notification.create({
      data: {
        userId: review.asset.uploadedById,
        type: 'REVIEW_CHANGES_REQUESTED',
        title: 'Changes requested for your asset',
        message: `Changes have been requested for "${review.asset.title}"`,
        metadata: {
          assetId: review.assetId,
          reviewId: review.id,
          status: 'NEEDS_REVISION',
          reviewerName: user!.name || user!.email,
          comments,
          requiredChanges
        }
      }
    })

    return successResponse({
      id: updatedReview.id,
      status: updatedReview.status,
      comments: updatedReview.comments,
      updatedAt: updatedReview.updatedAt,
      message: 'Changes requested successfully'
    })
  } catch (error) {
    console.error('Request changes error:', error)
    return ApiErrors.SERVER_ERROR('Failed to request changes')
  }
}