import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { ApiErrors } from '@/lib/api-response'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  creativeRole?: string | null
}

// Get authenticated user from session
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAuthUser(req?: NextRequest): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }
  
  return session.user as AuthUser
}

// Require authentication
export async function requireAuth(req?: NextRequest) {
  const user = await getAuthUser(req)
  
  if (!user) {
    // Return error response that can be returned directly from the endpoint
    return { user: null, error: ApiErrors.UNAUTHORIZED() }
  }
  
  // Attach user to request for downstream use
  if (req) {
    (req as any).user = user
  }
  
  return { user, error: null }
}

// Optional authentication (for public endpoints that may have enhanced features for authenticated users)
export async function optionalAuth(req?: NextRequest) {
  const user = await getAuthUser(req)
  
  // Attach user to request if authenticated
  if (req && user) {
    (req as any).user = user
  }
  
  return { user, error: null }
}

// Require specific roles
export async function requireRole(roles: UserRole[], req?: NextRequest) {
  const { user, error } = await requireAuth(req)
  
  if (error) return { user: null, error }
  
  if (!user || !roles.includes(user.role)) {
    return { user: null, error: ApiErrors.FORBIDDEN() }
  }
  
  return { user, error: null }
}

// Check if user has permission for an action
export function hasPermission(user: AuthUser, action: string, resource?: any): boolean {
  // Admin has all permissions
  if (user.role === 'ADMIN') return true
  
  // Define permissions by role
  const permissions: Record<UserRole, string[]> = {
    ADMIN: ['*'], // All permissions
    CONTENT_MANAGER: [
      'asset.create',
      'asset.read',
      'asset.update',
      'asset.delete',
      'asset.publish',
      'asset.download',  // Content managers can download
      'asset.review',    // Content managers can review
      'collection.create',
      'collection.read',
      'collection.update',
      'collection.delete',
      'tag.create',
      'tag.read',
      'tag.update',
      'tag.delete',
      'user.read',
      'analytics.read',
    ],
    CREATIVE: [
      'asset.create',
      'asset.read',  // Can view assets
      'asset.update.own',
      'asset.delete.own',
      // Note: CREATIVE role does NOT have asset.download permission
      'collection.create',
      'collection.read',
      'collection.update.own',
      'collection.delete.own',
      'tag.read',
      'analytics.read.own',
    ],
    REVIEWER: [
      'asset.read',  // Can view assets
      'asset.review',  // Can review assets
      // Note: REVIEWER role does NOT have asset.download permission
      'collection.read',
      'tag.read',
      'analytics.read',
    ],
    USER: [
      'asset.read',      // Can view assets
      'asset.download',  // Regular users CAN download
      'collection.create', // Users can create their own collections
      'collection.read',
      'collection.update.own', // Can update their own collections
      'collection.delete.own', // Can delete their own collections
      'tag.read',
    ],
  }
  
  const userPermissions = permissions[user.role] || []
  
  // Check if user has the specific permission
  if (userPermissions.includes('*') || userPermissions.includes(action)) {
    return true
  }
  
  // Check for ownership-based permissions
  if (action.endsWith('.own') && resource?.uploadedById === user.id) {
    const baseAction = action.replace('.own', '')
    return userPermissions.includes(action) || userPermissions.includes(baseAction)
  }
  
  return false
}

// Role hierarchy for comparison
const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 5,
  CONTENT_MANAGER: 4,
  REVIEWER: 3,
  CREATIVE: 2,
  USER: 1,
}

export function isRoleHigherOrEqual(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}