import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { sesService } from '@/lib/ses-enhanced'

// POST /api/share/notify - Send share notification email
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { user, error } = await requireAuth(request)
    if (error) return error

    const body = await request.json()
    const { email, token, assetTitle, message } = body

    if (!email || !token || !assetTitle) {
      return ApiErrors.VALIDATION_ERROR('Email, token, and asset title are required')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return ApiErrors.VALIDATION_ERROR('Invalid email address')
    }

    // Build share URL with language prefix
    const baseUrl = process.env.NEXTAUTH_URL || `https://${request.headers.get('host')}`
    // Extract language from referrer or default to 'en'
    const referrer = request.headers.get('referer') || ''
    const lngMatch = referrer.match(/\/(en|fr|es|de|ar|zh)\//)
    const lng = lngMatch ? lngMatch[1] : 'en'
    const shareUrl = `${baseUrl}/${lng}/share/${token}`

    // Send notification email
    try {
      await sesService.sendEmail({
        to: email,
        subject: `${user!.firstName || user!.email} shared "${assetTitle}" with you`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Asset Shared With You</h2>
            <p style="color: #666; line-height: 1.6;">
              ${user!.firstName || user!.email} has shared an asset with you from Content Hub.
            </p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">${assetTitle}</h3>
              ${message ? `
                <p style="color: #666; font-style: italic;">
                  "${message}"
                </p>
              ` : ''}
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              Click the button below to view the shared asset:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View Asset
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              Or copy this link: ${shareUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Content Hub. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
          ${user!.firstName || user!.email} has shared "${assetTitle}" with you.
          
          ${message ? `Message: "${message}"` : ''}
          
          View the asset at: ${shareUrl}
          
          This is an automated message from Content Hub.
        `
      })

      return successResponse({
        message: 'Notification sent successfully',
        recipient: email
      })
    } catch (emailError: any) {
      console.error('Failed to send share notification:', emailError)
      // Don't fail the whole operation if email fails
      return successResponse({
        message: 'Share link created but notification failed',
        recipient: email,
        warning: 'Email notification could not be sent'
      })
    }
  } catch (error) {
    console.error('Share notification error:', error)
    return ApiErrors.SERVER_ERROR('Failed to send share notification')
  }
}