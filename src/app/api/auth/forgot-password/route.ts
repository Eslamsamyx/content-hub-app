import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, ApiErrors } from '@/lib/api-response'
import crypto from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Apply rate limiting to prevent abuse
  const rateLimitResult = await rateLimit(request, {
    uniqueTokenPerInterval: 3,
    interval: 300000 // 3 requests per 5 minutes
  })
  
  if (!rateLimitResult.success) {
    return ApiErrors.RATE_LIMIT()
  }
  
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return ApiErrors.VALIDATION_ERROR('Email is required')
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Always return success to prevent email enumeration
    // But only send email if user exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpiry
        }
      })

      // Send email (if email service is configured)
      try {
        await sendPasswordResetEmail(user.email, resetToken)
      } catch {
        console.log('Email service not configured, reset token:', resetToken)
        // In development, log the token for testing
        if (process.env.NODE_ENV === 'development') {
          console.log(`Reset link: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`)
        }
      }
    }

    return successResponse({
      message: 'If an account exists with this email, a password reset link has been sent.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return ApiErrors.SERVER_ERROR('Failed to process password reset request')
  }
}