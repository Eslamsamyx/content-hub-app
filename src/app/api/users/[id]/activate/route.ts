import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { UserService } from '@/lib/user-service'
import { ActivityService } from '@/lib/activity-service'

// POST /api/users/:id/activate - Activate/deactivate user
export async function POST(
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
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return ApiErrors.VALIDATION_ERROR('isActive must be a boolean value')
    }

    // Prevent self-deactivation
    if (id === user!.id && !isActive) {
      return ApiErrors.VALIDATION_ERROR('You cannot deactivate your own account')
    }

    // Toggle user status
    const updatedUser = await UserService.toggleUserStatus(id, isActive)

    // Log activity
    await ActivityService.log({
      type: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      userId: user!.id,
      description: `${isActive ? 'Activated' : 'Deactivated'} user ${updatedUser.email}`,
      metadata: {
        targetUserId: id,
        newStatus: isActive
      }
    })

    return successResponse({
      userId: updatedUser.id,
      isActive: updatedUser.isActive,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update user status')
  }
}