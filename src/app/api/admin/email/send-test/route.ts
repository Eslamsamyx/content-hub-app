import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sesService } from '@/lib/ses-enhanced'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { to } = await request.json()
    
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      )
    }

    // Send test email
    await sesService.sendEmail({
      to,
      subject: 'Test Email from Content Hub',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Test Email Successful!</h1>
          <p style="color: #666; line-height: 1.6;">
            This is a test email from your Content Hub application.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you received this email, your email configuration is working correctly.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Sent from: ${session.user?.email || 'Admin'}<br>
            Time: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: `Test Email Successful!\n\nThis is a test email from your Content Hub application.\n\nIf you received this email, your email configuration is working correctly.\n\nSent from: ${session.user?.email || 'Admin'}\nTime: ${new Date().toLocaleString()}`,
    })
    
    return NextResponse.json({
      success: true,
      message: `Test email sent to ${to}`
    })
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}