import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function PUT(request: NextRequest) {
  try {
    // Get the file key from query params
    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')
    
    if (!key) {
      return NextResponse.json(
        { error: 'Missing file key' },
        { status: 400 }
      )
    }
    
    // Read the file data
    const data = await request.arrayBuffer()
    const buffer = Buffer.from(data)
    
    // Define local storage path
    const localStoragePath = join(process.cwd(), 'public', 'uploads')
    const filePath = join(localStoragePath, key)
    const fileDir = join(localStoragePath, key.split('/').slice(0, -1).join('/'))
    
    // Ensure directory exists
    if (!existsSync(fileDir)) {
      await mkdir(fileDir, { recursive: true })
    }
    
    // Write file to local storage
    await writeFile(filePath, buffer)
    
    console.log(`📁 File saved locally: ${filePath}`)
    
    // Return success response
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error: any) {
    console.error('Local upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
