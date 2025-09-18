import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

// GET /api/activity/export - Export activity log (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'export_data')) {
      return ApiErrors.FORBIDDEN()
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json' // json or csv
    const type = searchParams.get('type') as ActivityType | null
    const userId = searchParams.get('userId')
    const assetId = searchParams.get('assetId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = Math.min(10000, parseInt(searchParams.get('limit') || '1000'))

    // Build where clause
    const where: any = {}

    if (type) {
      where.type = type
    }

    if (userId) {
      where.userId = userId
    }

    if (assetId) {
      where.assetId = assetId
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Get activities with related data
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        asset: {
          select: {
            id: true,
            title: true,
            type: true,
            category: true,
            fileSize: true
          }
        },
        collection: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })

    // Format data for export
    const exportData = activities.map(activity => ({
      id: activity.id,
      timestamp: activity.createdAt.toISOString(),
      type: activity.type,
      description: activity.description || '',
      userId: activity.user.id,
      userName: `${activity.user.firstName} ${activity.user.lastName}`.trim() || '',
      userEmail: activity.user.email,
      userRole: activity.user.role,
      assetId: activity.asset?.id || '',
      assetTitle: activity.asset?.title || '',
      assetType: activity.asset?.type || '',
      assetCategory: activity.asset?.category || '',
      assetSize: activity.asset?.fileSize?.toString() || '',
      collectionId: activity.collection?.id || '',
      collectionName: activity.collection?.name || '',
      metadata: JSON.stringify(activity.metadata || {})
    }))

    // Return appropriate format
    if (format === 'csv') {
      const csv = convertToCSV(exportData)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-log-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else {
      // JSON format
      return new NextResponse(JSON.stringify({
        exportDate: new Date().toISOString(),
        totalRecords: exportData.length,
        filters: {
          type,
          userId,
          assetId,
          dateFrom,
          dateTo
        },
        data: exportData
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="activity-log-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    }
  } catch (error) {
    console.error('Export activity log error:', error)
    return ApiErrors.SERVER_ERROR('Failed to export activity log')
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  // Get headers
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')

  // Convert data rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      // Escape quotes and wrap in quotes if contains comma or newline
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })

  return [csvHeaders, ...csvRows].join('\n')
}