import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { TagCategory } from '@prisma/client'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PUT /api/tags/:id - Update tag
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'tag.update')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get existing tag
    const existingTag = await prisma.tag.findUnique({
      where: { id },
    })

    if (!existingTag) {
      return ApiErrors.NOT_FOUND('Tag')
    }

    // Parse request body
    const body = await request.json()
    const { name, category, color, description, isActive } = body

    // Prepare update data
    const updateData: any = {}

    if (name && name !== existingTag.name) {
      // Generate new slug
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      // Check if new slug already exists
      const duplicateTag = await prisma.tag.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (duplicateTag) {
        return ApiErrors.VALIDATION_ERROR('Tag with this name already exists')
      }

      updateData.name = name
      updateData.slug = slug
    }

    if (category && Object.values(TagCategory).includes(category)) {
      updateData.category = category
    }

    if (color !== undefined) updateData.color = color
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { assets: true },
        },
      },
    })

    return successResponse({
      id: updatedTag.id,
      name: updatedTag.name,
      slug: updatedTag.slug,
      category: updatedTag.category,
      color: updatedTag.color,
      description: updatedTag.description,
      isActive: updatedTag.isActive,
      usageCount: updatedTag._count.assets,
    })
  } catch (error) {
    console.error('Update tag error:', error)
    return ApiErrors.SERVER_ERROR('Failed to update tag')
  }
}

// DELETE /api/tags/:id - Delete tag
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'tag.delete')) {
      return ApiErrors.FORBIDDEN()
    }

    // Check if tag exists and get usage count
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    })

    if (!tag) {
      return ApiErrors.NOT_FOUND('Tag')
    }

    // Prevent deletion if tag is in use
    if (tag._count.assets > 0) {
      return ApiErrors.VALIDATION_ERROR(
        `Cannot delete tag that is used by ${tag._count.assets} assets. Consider deactivating it instead.`
      )
    }

    // Delete tag
    await prisma.tag.delete({
      where: { id },
    })

    return successResponse({ message: 'Tag deleted successfully' })
  } catch (error) {
    console.error('Delete tag error:', error)
    return ApiErrors.SERVER_ERROR('Failed to delete tag')
  }
}