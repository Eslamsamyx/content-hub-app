import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { UserService } from '@/lib/user-service'
import { ActivityService } from '@/lib/activity-service'

// GET /api/users/:id - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Check permissions - users can view their own profile, admins can view anyone
    if (id !== user!.id && !hasPermission(user!, 'manage_users')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get user details
    const userDetails = await UserService.getUserDetails(id)

    if (!userDetails) {
      return ApiErrors.NOT_FOUND('User not found')
    }

    // Format response
    const response = {
      id: userDetails.id,
      email: userDetails.email,
      name: `${userDetails.firstName} ${userDetails.lastName}`.trim(),
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      avatar: userDetails.avatar,
      role: userDetails.role,
      creativeRole: userDetails.creativeRole,
      bio: userDetails.bio,
      location: userDetails.location,
      socialLinks: userDetails.socialLinks,
      isActive: userDetails.isActive,
      emailVerified: userDetails.emailVerified,
      lastLogin: userDetails.lastLogin,
      createdAt: userDetails.createdAt,
      stats: {
        uploads: userDetails.stats.totalUploads,
        downloads: userDetails.stats.totalDownloads,
        collections: userDetails.stats.totalCollections,
        reviews: userDetails.stats.totalReviews,
        favorites: userDetails.stats.totalFavorites,
        activities: userDetails.stats.totalActivities,
        storageUsed: userDetails.stats.storageUsed.toString(),
        storageUsedGB: (Number(userDetails.stats.storageUsed) / (1024 * 1024 * 1024)).toFixed(2),
        lastActive: userDetails.stats.lastActive
      }
    }


    return successResponse(response)
  } catch (error) {
    console.error('Get user details error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch user details')
  }
}

// PATCH /api/users/:id - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Check admin permissions
    if (!hasPermission(user!, 'manage_users')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse request body
    const body = await request.json()
    const {
      firstName,
      lastName,
      role,
      creativeRole,
      // department, // Field doesn't exist in User model
      bio,
      location,
      socialLinks,
      isActive
    } = body

    // Update user
    const updatedUser = await UserService.updateUser(id, {
      firstName,
      lastName,
      role,
      creativeRole,
      // department, // Field doesn't exist in User model
      bio,
      location,
      socialLinks,
      isActive
    })

    // Log activity
    await ActivityService.log({
      type: 'USER_UPDATED',
      userId: user!.id,
      description: `Updated user ${updatedUser.email}`,
      metadata: {
        targetUserId: id,
        changes: body
      }
    })

    return successResponse({
      user: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Update user error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update user')
  }
}

// DELETE /api/users/:id - Deactivate user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const { id } = await params

    // Check admin permissions
    if (!hasPermission(user!, 'manage_users')) {
      return ApiErrors.FORBIDDEN()
    }

    // Prevent self-deactivation
    if (id === user!.id) {
      return ApiErrors.VALIDATION_ERROR('You cannot deactivate your own account')
    }

    // Deactivate user
    const deactivatedUser = await UserService.toggleUserStatus(id, false)

    // Log activity
    await ActivityService.log({
      type: 'USER_DEACTIVATED',
      userId: user!.id,
      description: `Deactivated user ${deactivatedUser.email}`,
      metadata: {
        targetUserId: id
      }
    })

    return successResponse({
      message: 'User deactivated successfully',
      userId: deactivatedUser.id
    })
  } catch (error) {
    console.error('Deactivate user error:', error)
    return ApiErrors.SERVER_ERROR('Failed to deactivate user')
  }
}