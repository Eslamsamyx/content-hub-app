import { isRedisConnected } from '@/lib/redis'

// Workers will be null if Redis is not connected
let imageProcessingWorker: any = null
let videoProcessingWorker: any = null

// Wait for Redis connection
async function waitForRedis(maxAttempts = 10, delay = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    if (isRedisConnected()) {
      return true
    }
    if (i < maxAttempts - 1) {
      console.log(`Waiting for Redis connection... (${i + 1}/${maxAttempts})`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return false
}

// Start all workers
export async function startWorkers() {
  console.log('Starting background workers...')
  
  // Wait for Redis to connect
  const connected = await waitForRedis()
  
  // Check if Redis is connected
  if (!connected) {
    console.error('Cannot start workers: Redis is not connected.')
    console.log('Please ensure Redis is installed and running:')
    console.log('  - macOS: brew install redis && brew services start redis')
    console.log('  - Ubuntu: sudo apt-get install redis-server && sudo systemctl start redis')
    console.log('  - Docker: docker run -d -p 6379:6379 redis:alpine')
    return
  }

  try {
    // Dynamically import workers only if Redis is available
    const { imageProcessingWorker: imgWorker } = await import('./image-processor')
    const { videoProcessingWorker: vidWorker } = await import('./video-processor')
    
    imageProcessingWorker = imgWorker
    videoProcessingWorker = vidWorker

    // Log worker status
    imageProcessingWorker.on('ready', () => {
      console.log('Image processing worker ready')
    })
    
    videoProcessingWorker.on('ready', () => {
      console.log('Video processing worker ready')
    })

    // Handle worker errors
    imageProcessingWorker.on('error', (error: Error) => {
      console.error('Image processing worker error:', error)
    })

    videoProcessingWorker.on('error', (error: Error) => {
      console.error('Video processing worker error:', error)
    })
    
    console.log('Workers started successfully!')
  } catch (error) {
    console.error('Failed to start workers:', error)
  }
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down workers...')
    if (imageProcessingWorker) await imageProcessingWorker.close()
    if (videoProcessingWorker) await videoProcessingWorker.close()
    process.exit(0)
  })
}

// Export workers for potential direct access
export { imageProcessingWorker, videoProcessingWorker }