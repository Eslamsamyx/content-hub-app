import { Queue, QueueEvents } from 'bullmq'
import redis, { isRedisConnected } from './redis'

// Define job types
export enum JobType {
  PROCESS_IMAGE = 'process-image',
  PROCESS_VIDEO = 'process-video',
  PROCESS_DOCUMENT = 'process-document',
  PROCESS_AUDIO = 'process-audio',
  PROCESS_3D = 'process-3d',
  CLEANUP_ASSET = 'cleanup-asset',
  GENERATE_ANALYTICS = 'generate-analytics',
}

// Queue instances (may be null if Redis is not available)
let assetProcessingQueue: Queue | null = null
let maintenanceQueue: Queue | null = null
let assetProcessingEvents: QueueEvents | null = null

// Initialize queues if Redis is available
try {
  assetProcessingQueue = new Queue('asset-processing', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  })

  maintenanceQueue = new Queue('maintenance', {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: true,
      removeOnFail: false,
    },
  })

  assetProcessingEvents = new QueueEvents('asset-processing', {
    connection: redis,
  })
} catch (error) {
  console.error('Failed to initialize queues:', error)
  console.log('Background job processing will be disabled.')
}

// Add job to asset processing queue with fallback
export async function addAssetProcessingJob(
  type: JobType,
  data: any,
  priority?: number
) {
  if (!assetProcessingQueue || !isRedisConnected()) {
    console.warn(`Cannot add job ${type}: Redis is not connected. Job will be skipped.`)
    // Return a mock job object to prevent errors in calling code
    return {
      id: `mock-${Date.now()}`,
      data,
      opts: { priority },
      progress: 0,
      attemptsMade: 0,
      processedOn: Date.now(),
    }
  }

  try {
    return await assetProcessingQueue.add(type, data, {
      priority,
      delay: 0,
    })
  } catch (error) {
    console.error(`Failed to add job ${type}:`, error)
    throw error
  }
}

// Add maintenance job with fallback
export async function addMaintenanceJob(
  type: string,
  data: any,
  options?: {
    delay?: number
    repeat?: {
      pattern?: string
      every?: number
    }
  }
) {
  if (!maintenanceQueue || !isRedisConnected()) {
    console.warn(`Cannot add maintenance job ${type}: Redis is not connected.`)
    return null
  }

  try {
    return await maintenanceQueue.add(type, data, options)
  } catch (error) {
    console.error(`Failed to add maintenance job ${type}:`, error)
    throw error
  }
}

// Export queue instances (may be null)
export { assetProcessingQueue, maintenanceQueue, assetProcessingEvents }