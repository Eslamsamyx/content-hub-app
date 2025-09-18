const { Queue, Worker } = require('bullmq')
const Redis = require('ioredis')
require('dotenv').config({ path: '.env.local' })

async function testQueue() {
  console.log('Testing job queue processing...\n')
  
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: null,
  })

  // Create a test queue
  const testQueue = new Queue('test-queue', { connection: redis })
  
  // Create a test worker
  const testWorker = new Worker(
    'test-queue',
    async (job) => {
      console.log(`Processing job ${job.id} with data:`, job.data)
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true, processed: job.data }
    },
    { connection: redis }
  )

  // Add event listeners
  testWorker.on('completed', (job, result) => {
    console.log(`✅ Job ${job.id} completed successfully!`)
    console.log('Result:', result)
  })

  testWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message)
  })

  // Add test jobs
  console.log('Adding test jobs to queue...')
  const job1 = await testQueue.add('test-job-1', { message: 'Hello from job 1' })
  const job2 = await testQueue.add('test-job-2', { message: 'Hello from job 2' })
  const job3 = await testQueue.add('test-job-3', { message: 'Hello from job 3' })
  
  console.log('Jobs added:', [job1.id, job2.id, job3.id])
  console.log('\nWaiting for jobs to process...\n')

  // Wait for all jobs to complete
  await new Promise(resolve => setTimeout(resolve, 5000))

  // Check queue status
  const waiting = await testQueue.getWaitingCount()
  const active = await testQueue.getActiveCount()
  const completed = await testQueue.getCompletedCount()
  const failed = await testQueue.getFailedCount()

  console.log('\nQueue Status:')
  console.log(`- Waiting: ${waiting}`)
  console.log(`- Active: ${active}`)
  console.log(`- Completed: ${completed}`)
  console.log(`- Failed: ${failed}`)

  // Cleanup
  await testWorker.close()
  await testQueue.obliterate({ force: true })
  await redis.quit()
  
  console.log('\n✅ Job queue test completed successfully!')
}

testQueue().catch(console.error)