import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sesService } from '@/lib/ses-enhanced'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const status = sesService.getStatus()
    
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error getting email config:', error)
    return NextResponse.json(
      { error: 'Failed to get email configuration' },
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
    
    // Validate required fields when email is enabled
    if (config.enabled) {
      if (!config.fromEmail) {
        return NextResponse.json(
          { error: 'From email is required' },
          { status: 400 }
        )
      }
      
      if (config.provider === 'ses' && (!config.accessKeyId || !config.secretAccessKey)) {
        return NextResponse.json(
          { error: 'AWS credentials required for SES' },
          { status: 400 }
        )
      }
      
      if (config.provider === 'smtp' && (!config.smtpHost || !config.smtpPort)) {
        return NextResponse.json(
          { error: 'SMTP host and port required' },
          { status: 400 }
        )
      }
    }

    // Pass user ID for audit trail
    await sesService.updateConfig(config, session.user.id)
    const status = sesService.getStatus()
    
    return NextResponse.json({
      message: 'Configuration updated successfully',
      ...status
    })
  } catch (error: any) {
    console.error('Error updating email config:', error)
    return NextResponse.json(
      { error: 'Failed to update email configuration' },
      { status: 500 }
    )
  }
}