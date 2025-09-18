#!/usr/bin/env node

/**
 * Check and update S3 CORS configuration
 */

const { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } = require('@aws-sdk/client-s3')
const { ConfigurationService } = require('../.next/server/chunks/986.js') // Compiled lib path

async function checkAndUpdateCORS() {
  try {
    // Get S3 configuration from database
    const s3Config = await ConfigurationService.getS3Config()
    
    if (!s3Config || !s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.bucket) {
      console.error('❌ S3 configuration not found or incomplete')
      process.exit(1)
    }

    console.log('🔍 Checking S3 CORS configuration...')
    console.log('Bucket:', s3Config.bucket)
    console.log('Region:', s3Config.region)

    const client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      }
    })

    // Try to get current CORS configuration
    try {
      const getCorsCommand = new GetBucketCorsCommand({
        Bucket: s3Config.bucket
      })
      const currentCors = await client.send(getCorsCommand)
      console.log('\n📋 Current CORS configuration:')
      console.log(JSON.stringify(currentCors.CORSRules, null, 2))
    } catch (error) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('\n⚠️ No CORS configuration found on bucket')
      } else {
        throw error
      }
    }

    // Define the proper CORS configuration
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://your-domain.com', // Replace with your actual domain
            '*' // For testing - remove in production
          ],
          ExposeHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2'
          ],
          MaxAgeSeconds: 3000
        }
      ]
    }

    console.log('\n✅ Updating CORS configuration...')
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: s3Config.bucket,
      CORSConfiguration: corsConfiguration
    })

    await client.send(putCorsCommand)
    console.log('✅ CORS configuration updated successfully!')

    // Verify the update
    const verifyCommand = new GetBucketCorsCommand({
      Bucket: s3Config.bucket
    })
    const updatedCors = await client.send(verifyCommand)
    console.log('\n📋 Updated CORS configuration:')
    console.log(JSON.stringify(updatedCors.CORSRules, null, 2))

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  checkAndUpdateCORS().then(() => {
    process.exit(0)
  }).catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { checkAndUpdateCORS }