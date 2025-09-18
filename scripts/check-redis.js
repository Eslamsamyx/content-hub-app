const Redis = require('ioredis')
require('dotenv').config({ path: '.env.local' })

async function checkRedis() {
  console.log('Checking Redis connection...')
  console.log(`Host: ${process.env.REDIS_HOST || 'localhost'}`)
  console.log(`Port: ${process.env.REDIS_PORT || '6379'}`)
  
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    connectTimeout: 5000,
  })

  try {
    await redis.ping()
    console.log('✅ Redis connection successful!')
    
    // Test basic operations
    await redis.set('test:key', 'test-value')
    const value = await redis.get('test:key')
    console.log('✅ Redis operations working:', value)
    
    // Clean up
    await redis.del('test:key')
    
    // Check if BullMQ can connect
    const { Queue } = require('bullmq')
    const testQueue = new Queue('test-queue', { connection: redis })
    await testQueue.add('test-job', { test: true })
    console.log('✅ BullMQ queue operations working!')
    
    // Clean up
    await testQueue.obliterate({ force: true })
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message)
    console.log('\nPlease ensure Redis is installed and running:')
    console.log('  - macOS: brew install redis && brew services start redis')
    console.log('  - Ubuntu: sudo apt-get install redis-server && sudo systemctl start redis')
    console.log('  - Docker: docker run -d -p 6379:6379 redis:alpine')
  } finally {
    await redis.quit()
  }
}

checkRedis()