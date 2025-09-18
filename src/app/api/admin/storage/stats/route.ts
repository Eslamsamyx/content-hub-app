import { NextResponse } from 'next/server'
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

    const stats = await s3Service.getStorageStats()
    
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error getting storage stats:', error)
    return NextResponse.json(
      { error: 'Failed to get storage statistics' },
      { status: 500 }
    )
  }
}