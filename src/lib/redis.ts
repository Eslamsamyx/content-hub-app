import Redis from 'ioredis'

// Create Redis connection with enhanced error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null, // Required by BullMQ
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    if (times > 10) {
      console.error('Redis connection failed after 10 attempts')
      // Return null to stop retrying
      return null
    }
    return delay
  },
  lazyConnect: true, // Don't connect until first command
})

// Track connection state
let isConnected = false
let connectionError: Error | null = null

redis.on('error', (error) => {
  console.error('Redis connection error:', error.message)
  connectionError = error
  isConnected = false
})

redis.on('connect', () => {
  console.log('Redis connected successfully')
  isConnected = true
  connectionError = null
})

redis.on('close', () => {
  console.log('Redis connection closed')
  isConnected = false
})

// Connect to Redis
redis.connect().catch((error) => {
  console.error('Failed to connect to Redis:', error.message)
  console.log('The application will continue without background job processing.')
  console.log('To enable job processing, please install and start Redis.')
})

// Export connection status helpers
export const isRedisConnected = () => isConnected
export const getRedisError = () => connectionError

export default redis