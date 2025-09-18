import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// GET /api/notifications/preferences - Get notification settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get or create preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user!.id }
    })

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user!.id
        }
      })
    }

    return successResponse({
      id: preferences.id,
      email: {
        enabled: preferences.emailEnabled,
        assetApproved: preferences.emailAssetApproved,
        assetRejected: preferences.emailAssetRejected,
        reviewAssigned: preferences.emailReviewAssigned,
        assetShared: preferences.emailAssetShared,
        collectionShared: preferences.emailCollectionShared
      },
      inApp: {
        enabled: preferences.inAppEnabled,
        assetApproved: preferences.inAppAssetApproved,
        assetRejected: preferences.inAppAssetRejected,
        reviewAssigned: preferences.inAppReviewAssigned,
        assetShared: preferences.inAppAssetShared,
        collectionShared: preferences.inAppCollectionShared,
        systemUpdates: preferences.inAppSystemUpdates
      },
      digest: {
        enabled: preferences.digestEnabled,
        frequency: preferences.digestFrequency,
        lastSent: preferences.lastDigestSent
      }
    })
  } catch (error) {
    console.error('Get notification preferences error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch notification preferences')
  }
}

// PATCH /api/notifications/preferences - Update notification settings
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body = await request.json()
    const { email, inApp, digest } = body

    // Build update data
    const updateData: any = {}

    // Update email preferences
    if (email !== undefined) {
      if (email.enabled !== undefined) updateData.emailEnabled = email.enabled
      if (email.assetApproved !== undefined) updateData.emailAssetApproved = email.assetApproved
      if (email.assetRejected !== undefined) updateData.emailAssetRejected = email.assetRejected
      if (email.reviewAssigned !== undefined) updateData.emailReviewAssigned = email.reviewAssigned
      if (email.assetShared !== undefined) updateData.emailAssetShared = email.assetShared
      if (email.collectionShared !== undefined) updateData.emailCollectionShared = email.collectionShared
    }

    // Update in-app preferences
    if (inApp !== undefined) {
      if (inApp.enabled !== undefined) updateData.inAppEnabled = inApp.enabled
      if (inApp.assetApproved !== undefined) updateData.inAppAssetApproved = inApp.assetApproved
      if (inApp.assetRejected !== undefined) updateData.inAppAssetRejected = inApp.assetRejected
      if (inApp.reviewAssigned !== undefined) updateData.inAppReviewAssigned = inApp.reviewAssigned
      if (inApp.assetShared !== undefined) updateData.inAppAssetShared = inApp.assetShared
      if (inApp.collectionShared !== undefined) updateData.inAppCollectionShared = inApp.collectionShared
      if (inApp.systemUpdates !== undefined) updateData.inAppSystemUpdates = inApp.systemUpdates
    }

    // Update digest preferences
    if (digest !== undefined) {
      if (digest.enabled !== undefined) updateData.digestEnabled = digest.enabled
      if (digest.frequency !== undefined) {
        if (!['daily', 'weekly', 'monthly'].includes(digest.frequency)) {
          return ApiErrors.VALIDATION_ERROR('Invalid digest frequency. Must be daily, weekly, or monthly')
        }
        updateData.digestFrequency = digest.frequency
      }
    }

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: user!.id },
      update: updateData,
      create: {
        userId: user!.id,
        ...updateData
      }
    })

    return successResponse({
      message: 'Notification preferences updated successfully',
      preferences: {
        email: {
          enabled: preferences.emailEnabled,
          assetApproved: preferences.emailAssetApproved,
          assetRejected: preferences.emailAssetRejected,
          reviewAssigned: preferences.emailReviewAssigned,
          assetShared: preferences.emailAssetShared,
          collectionShared: preferences.emailCollectionShared
        },
        inApp: {
          enabled: preferences.inAppEnabled,
          assetApproved: preferences.inAppAssetApproved,
          assetRejected: preferences.inAppAssetRejected,
          reviewAssigned: preferences.inAppReviewAssigned,
          assetShared: preferences.inAppAssetShared,
          collectionShared: preferences.inAppCollectionShared,
          systemUpdates: preferences.inAppSystemUpdates
        },
        digest: {
          enabled: preferences.digestEnabled,
          frequency: preferences.digestFrequency,
          lastSent: preferences.lastDigestSent
        }
      }
    })
  } catch (error) {
    console.error('Update notification preferences error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update notification preferences')
  }
}