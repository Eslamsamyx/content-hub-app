import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-middleware'
import { successResponse, ApiErrors } from '@/lib/api-response'
import { getDownloadUrl } from '@/lib/s3-enhanced'
import archiver from 'archiver'
import { Readable, PassThrough } from 'stream'

export async function POST(request: NextRequest) {
  // Check auth before trying to parse body
  const { user, error } = await requireAuth(request)
  if (error) return error
  
  let body
  try {
    body = await request.json()
  } catch {
    return ApiErrors.VALIDATION_ERROR('Invalid request body')
  }
  
  try {
    const { assetIds, collectionId } = body
    
    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return ApiErrors.VALIDATION_ERROR('Asset IDs are required')
    }
    
    if (assetIds.length > 100) {
      return ApiErrors.VALIDATION_ERROR('Maximum 100 assets can be downloaded at once')
    }
    
    // Fetch assets based on provided IDs or collection
    let assets
    
    if (collectionId) {
      // Verify collection access
      const collection = await prisma.collection.findFirst({
        where: {
          id: collectionId,
          OR: [
            { createdById: user!.id },
            { isPublic: true }
          ]
        }
      })
      
      if (!collection) {
        return ApiErrors.NOT_FOUND('Collection')
      }
      
      assets = await prisma.asset.findMany({
        where: {
          id: { in: assetIds },
          collections: {
            some: {
              collectionId: collectionId
            }
          },
          isArchived: false
        },
        select: {
          id: true,
          title: true,
          fileKey: true,
          type: true,
          mimeType: true
        }
      })
    } else {
      // Fetch assets directly
      assets = await prisma.asset.findMany({
        where: {
          id: { in: assetIds },
          isArchived: false
        },
        select: {
          id: true,
          title: true,
          fileKey: true,
          type: true,
          mimeType: true
        }
      })
    }
    
    if (assets.length === 0) {
      return ApiErrors.NOT_FOUND('Assets')
    }
    
    // For single asset, return direct download URL
    if (assets.length === 1) {
      const asset = assets[0]
      const downloadUrl = await getDownloadUrl(asset.fileKey)
      
      return successResponse({
        type: 'single',
        url: downloadUrl,
        filename: `${asset.title}${getFileExtension(asset.type)}`
      })
    }
    
    // For multiple assets under 5, return individual URLs
    if (assets.length <= 5) {
      const downloadUrls = await Promise.all(
        assets.map(async (asset) => ({
          id: asset.id,
          title: asset.title,
          url: await getDownloadUrl(asset.fileKey)
        }))
      )
      
      return successResponse({
        type: 'individual',
        assets: downloadUrls
      })
    }

    // For larger batches, create a ZIP stream using streaming to avoid memory issues
    const zipFileName = collectionId 
      ? `collection_${collectionId}_assets.zip`
      : `batch_download_${Date.now()}.zip`
    
    // Create a PassThrough stream for the response
    const passThrough = new PassThrough()
    
    // Create archive with streaming
    const archive = archiver('zip', {
      zlib: { level: 6 }
    })
    
    // Pipe archive to the PassThrough stream
    archive.pipe(passThrough)
    
    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      passThrough.destroy(err)
    })
    
    // Process assets with streaming to avoid memory issues
    const processAssets = async () => {
      for (const asset of assets) {
        if (!asset.fileKey) continue

        try {
          const downloadUrl = await getDownloadUrl(asset.fileKey)
          const response = await fetch(downloadUrl)
          
          if (response.ok && response.body) {
            const extension = getFileExtension(asset.type)
            const fileName = sanitizeFileName(`${asset.title}${extension}`)
            
            // Stream the file directly to the archive without loading into memory
            const reader = response.body.getReader()
            const stream = new Readable({
              async read() {
                const { done, value } = await reader.read()
                if (done) {
                  this.push(null)
                } else {
                  this.push(Buffer.from(value))
                }
              }
            })
            
            archive.append(stream, { name: fileName })
          }
        } catch (error) {
          console.error(`Failed to add asset ${asset.id} to archive:`, error)
          // Continue with other assets
        }
      }
      
      // Finalize the archive
      await archive.finalize()
    }
    
    // Start processing assets
    processAssets().catch((error) => {
      console.error('Asset processing error:', error)
      passThrough.destroy(error)
    })
    
    // Create activity log for batch download
    await prisma.activity.create({
      data: {
        type: 'ASSET_DOWNLOADED',
        description: `Downloaded ${assets.length} assets as batch`,
        userId: user!.id,
        metadata: {
          assetIds: assets.map(a => a.id),
          count: assets.length
        }
      }
    })
    
    // Return the streaming response
    return new NextResponse(passThrough as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Transfer-Encoding': 'chunked'
      }
    })

  } catch (error) {
    console.error('Batch download error:', error)
    return ApiErrors.SERVER_ERROR('Failed to create batch download')
  }
}

function getFileExtension(type: string): string {
  const typeMap: Record<string, string> = {
    IMAGE: '.jpg',
    VIDEO: '.mp4',
    AUDIO: '.mp3',
    DOCUMENT: '.pdf',
    DESIGN: '.png',
    MODEL_3D: '.obj'
  }
  
  return typeMap[type] || '.bin'
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 200)
}