import { NextResponse } from 'next/server'
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

    const queueStatus = await sesService.getQueueStatus()
    
    return NextResponse.json(queueStatus)
  } catch (error: any) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      { enabled: false },
      { status: 200 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await sesService.clearQueue()
    
    return NextResponse.json({
      success: true,
      message: 'Email queue cleared successfully'
    })
  } catch (error: any) {
    console.error('Error clearing queue:', error)
    return NextResponse.json(
      { error: 'Failed to clear email queue' },
      { status: 500 }
    )
  }
}