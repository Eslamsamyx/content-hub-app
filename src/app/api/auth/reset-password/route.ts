import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, ApiErrors } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return ApiErrors.VALIDATION_ERROR('Token and password are required')
    }

    // Validate password strength
    if (password.length < 8) {
      return ApiErrors.VALIDATION_ERROR('Password must be at least 8 characters long')
    }

    // Find user by reset token and check if it's not expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Token must not be expired
        }
      }
    })

    if (!user) {
      return ApiErrors.VALIDATION_ERROR('Invalid or expired reset token')
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    })

    return successResponse({
      message: 'Password has been reset successfully'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return ApiErrors.SERVER_ERROR('Failed to reset password')
  }
}

// GET endpoint to validate token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return ApiErrors.VALIDATION_ERROR('Token is required')
    }

    // Check if token exists and is not expired
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        email: true
      }
    })

    if (!user) {
      return ApiErrors.VALIDATION_ERROR('Invalid or expired reset token')
    }

    return successResponse({
      valid: true,
      email: user.email
    })
  } catch (error) {
    console.error('Validate reset token error:', error)
    return ApiErrors.SERVER_ERROR('Failed to validate token')
  }
}