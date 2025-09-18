import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { UserService } from '@/lib/user-service'
import { UserRole, CreativeRole } from '@prisma/client'

// GET /api/users - List users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'manage_users')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role') as UserRole | null
    const creativeRole = searchParams.get('creativeRole') as CreativeRole | null
    const status = searchParams.get('status')
    const search = searchParams.get('search') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build filters
    const filters = {
      role: role || undefined,
      creativeRole: creativeRole || undefined,
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
      search,
      page,
      limit,
      sortBy,
      sortOrder
    }

    // Get users
    const result = await UserService.listUsers(filters)

    // Format response
    const formattedUsers = result.users.map(user => ({
      id: user.id,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      creativeRole: user.creativeRole,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      stats: {
        uploads: (user as any)._count?.uploads || 0,
        downloads: (user as any)._count?.downloads || 0,
        collections: (user as any)._count?.collections || 0,
        reviews: (user as any)._count?.reviews || 0
      }
    }))

    return successResponse({
      users: formattedUsers,
      pagination: result.pagination
    })
  } catch (error) {
    console.error('List users error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch users')
  }
}