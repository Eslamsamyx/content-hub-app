import { NextRequest } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { prisma } from '@/lib/prisma'

// GET /api/system/jobs - Job queue status (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    // Check admin permissions
    if (!hasPermission(user!, 'view_system_metrics')) {
      return ApiErrors.FORBIDDEN()
    }

    // Get processing job statistics
    const [
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      recentJobs
    ] = await Promise.all([
      // Pending jobs
      prisma.asset.count({
        where: {
          processingStatus: 'PENDING'
        }
      }),
      
      // Processing jobs
      prisma.asset.count({
        where: {
          processingStatus: 'PROCESSING'
        }
      }),
      
      // Completed jobs (last 24 hours)
      prisma.asset.count({
        where: {
          processingStatus: 'COMPLETED',
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Failed jobs
      prisma.asset.count({
        where: {
          processingStatus: 'FAILED'
        }
      }),
      
      // Recent job activity
      prisma.asset.findMany({
        where: {
          processingStatus: {
            in: ['PROCESSING', 'FAILED', 'COMPLETED']
          }
        },
        select: {
          id: true,
          title: true,
          type: true,
          processingStatus: true,
          processingError: true,
          createdAt: true,
          updatedAt: true,
          uploadedBy: {
            select: {
            firstName: true,
              email: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 20
      })
    ])

    // Calculate job processing rate
    const jobsLast24h = completedJobs
    const jobsPerHour = (jobsLast24h / 24).toFixed(1)

    // Get failed job breakdown
    const failedJobTypes = await prisma.asset.groupBy({
      by: ['type'],
      where: {
        processingStatus: 'FAILED'
      },
      _count: true
    })

    return successResponse({
      summary: {
        pending: pendingJobs,
        processing: processingJobs,
        completed24h: completedJobs,
        failed: failedJobs,
        jobsPerHour: parseFloat(jobsPerHour)
      },
      failedByType: failedJobTypes.map(item => ({
        type: item.type,
        count: item._count
      })),
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        title: job.title,
        type: job.type,
        status: job.processingStatus,
        error: job.processingError,
        uploadedBy: job.uploadedBy,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        processingTime: job.processingStatus === 'COMPLETED' 
          ? Math.round((job.updatedAt.getTime() - job.createdAt.getTime()) / 1000)
          : null
      })),
      health: {
        status: failedJobs > 10 ? 'unhealthy' : 
                processingJobs > 50 ? 'degraded' : 'healthy',
        message: failedJobs > 10 ? 'High number of failed jobs' :
                processingJobs > 50 ? 'Processing queue is backed up' :
                'Job processing is running smoothly'
      }
    })
  } catch (error) {
    console.error('Get job queue status error:', error)
    return ApiErrors.SERVER_ERROR('Failed to fetch job queue status')
  }
}