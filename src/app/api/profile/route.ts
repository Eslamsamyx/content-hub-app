import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

// GET /api/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Get full user profile
    const profile = await prisma.user.findUnique({
      where: { id: user!.id },
      include: {
        _count: {
          select: {
            uploads: {
              where: { isArchived: false },
            },
            collections: true,
            favorites: true,
            downloads: true,
          },
        },
      },
    })

    if (!profile) {
      return ApiErrors.NOT_FOUND('User profile')
    }

    // Get user statistics
    const [totalViews, recentActivity, topAssets] = await Promise.all([
      // Total views on user's assets
      prisma.asset.aggregate({
        where: { uploadedById: user!.id },
        _sum: { viewCount: true },
      }),
      // Recent activity
      prisma.activity.findMany({
        where: { userId: user!.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          asset: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      }),
      // Top performing assets
      prisma.asset.findMany({
        where: { 
          uploadedById: user!.id,
          isArchived: false,
        },
        orderBy: [
          { viewCount: 'desc' },
          { downloadCount: 'desc' },
        ],
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          viewCount: true,
          downloadCount: true,
          thumbnailKey: true,
        },
      }),
    ])

    // Generate avatar URL if exists
    let avatarUrl = null
    if (profile.avatar) {
      avatarUrl = await getDownloadUrl(profile.avatar, undefined, 86400) // 24 hours
    }

    // Transform response
    const response = {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: `${profile.firstName} ${profile.lastName}`,
      avatar: avatarUrl,
      role: profile.role,
      creativeRole: profile.creativeRole,
      bio: profile.bio,
      location: profile.location,
      socialLinks: profile.socialLinks,
      isActive: profile.isActive,
      emailVerified: profile.emailVerified,
      lastLogin: profile.lastLogin,
      createdAt: profile.createdAt,
      stats: {
        totalAssets: profile._count.uploads,
        totalCollections: profile._count.collections,
        totalFavorites: profile._count.favorites,
        totalDownloads: profile._count.downloads,
        totalViews: totalViews._sum.viewCount || 0,
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        createdAt: activity.createdAt,
        asset: activity.asset,
      })),
      topAssets: await Promise.all(
        topAssets.map(async (asset) => ({
          ...asset,
          thumbnailUrl: asset.thumbnailKey 
            ? await getDownloadUrl(asset.thumbnailKey, undefined, 3600)
            : null,
        }))
      ),
    }

    return successResponse(response)
  } catch (error) {
    console.error('Get profile error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch profile')
  }
}

// PATCH /api/profile - Update own profile
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Parse request body
    const body = await request.json()
    const { firstName, lastName, bio, location, socialLinks } = body

    // Validate input
    if (!firstName && !lastName && bio === undefined && location === undefined && socialLinks === undefined) {
      return ApiErrors.VALIDATION_ERROR('No fields to update')
    }

    // Update profile
    const updatedProfile = await prisma.user.update({
      where: { id: user!.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
        ...(socialLinks !== undefined && { socialLinks }),
      },
    })

    return successResponse({
      id: updatedProfile.id,
      email: updatedProfile.email,
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      fullName: `${updatedProfile.firstName} ${updatedProfile.lastName}`,
      role: updatedProfile.role,
      creativeRole: updatedProfile.creativeRole,
      bio: updatedProfile.bio,
      location: updatedProfile.location,
      socialLinks: updatedProfile.socialLinks,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update profile')
  }
}