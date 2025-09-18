import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'
import { getDownloadUrl } from '@/lib/s3-enhanced'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/assets/:id/download - Generate secure download URL
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check permission
    if (!hasPermission(user!, 'asset.download')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get asset
    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        fileKey: true,
        originalFilename: true,
        mimeType: true,
      },
    })

    if (!asset) {
      return ApiErrors.NOT_FOUND('Asset')
    }

    // Generate download URL with proper filename
    const downloadUrl = await getDownloadUrl(
      asset.fileKey, 
      asset.originalFilename,
      3600 // 1 hour expiry
    )

    // Track download
    await prisma.download.create({
      data: {
        assetId: id,
        userId: user!.id,
        purpose: request.nextUrl.searchParams.get('purpose') || undefined,
        project: request.nextUrl.searchParams.get('project') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      },
    })

    // Update download count
    await prisma.asset.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_DOWNLOADED',
        description: `Downloaded ${asset.title}`,
        userId: user!.id,
        assetId: id,
      },
    })

    // Update analytics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.assetAnalytics.upsert({
      where: {
        assetId_date: {
          assetId: id,
          date: today,
        },
      },
      update: {
        downloads: { increment: 1 },
      },
      create: {
        assetId: id,
        date: today,
        downloads: 1,
        views: 0,
      },
    })

    return successResponse({
      downloadUrl,
      filename: asset.originalFilename,
      mimeType: asset.mimeType,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Download asset error:', error)
    return ApiErrors.SERVER_ERROR('Failed to generate download URL')
  }
}