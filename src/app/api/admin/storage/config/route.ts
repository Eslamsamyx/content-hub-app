import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { s3Service } from '@/lib/s3-enhanced'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const status = s3Service.getStatus()
    
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error getting storage config:', error)
    return NextResponse.json(
      { error: 'Failed to get storage configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const config = await request.json()
    
    // Validate required fields when S3 is enabled
    if (config.enabled) {
      if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        return NextResponse.json(
          { error: 'Missing required S3 configuration' },
          { status: 400 }
        )
      }
    }

    // Pass user ID for audit trail
    await s3Service.updateConfig(config, session.user.id)
    const status = s3Service.getStatus()
    
    return NextResponse.json({
      message: 'Configuration updated successfully',
      ...status
    })
  } catch (error: any) {
    console.error('Error updating storage config:', error)
    return NextResponse.json(
      { error: 'Failed to update storage configuration' },
      { status: 500 }
    )
  }
}