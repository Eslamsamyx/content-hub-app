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

    const config = await request.json()
    
    // Temporarily update config for testing
    await sesService.updateConfig(config)
    
    // Test the connection
    const result = await sesService.testConnection()
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error testing email connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test email connection' 
      },
      { status: 500 }
    )
  }
}