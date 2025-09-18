#!/usr/bin/env tsx

/**
 * Setup S3 CORS configuration for uploads
 */

import { S3Client, GetBucketCorsCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

// Decrypt function (matching config-service.ts)
function decrypt(encryptedData: any): string {
  const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY
    ? Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex')
    : crypto.createHash('sha256').update(
        process.env.NEXTAUTH_SECRET || 'default-key-change-in-production'
      ).digest()

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  )
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

async function getS3Config() {
  const config = await prisma.systemConfiguration.findUnique({
    where: { key: 's3_config' }
  })
  
  if (!config) {
    throw new Error('S3 configuration not found in database')
  }
  
  const value = config.value as any
  
  // Decrypt sensitive fields
  if (value.accessKeyId && typeof value.accessKeyId === 'object') {
    value.accessKeyId = decrypt(value.accessKeyId)
  }
  if (value.secretAccessKey && typeof value.secretAccessKey === 'object') {
    value.secretAccessKey = decrypt(value.secretAccessKey)
  }
  
  return value
}

async function setupCORS() {
  try {
    console.log('🔍 Getting S3 configuration from database...')
    const s3Config = await getS3Config()
    
    console.log('Bucket:', s3Config.bucket)
    console.log('Region:', s3Config.region)

    const client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      }
    })

    // Check current CORS
    try {
      const getCorsCommand = new GetBucketCorsCommand({
        Bucket: s3Config.bucket
      })
      const currentCors = await client.send(getCorsCommand)
      console.log('\n📋 Current CORS configuration:')
      console.log(JSON.stringify(currentCors.CORSRules, null, 2))
    } catch (error: any) {
      if (error.name === 'NoSuchCORSConfiguration') {
        console.log('\n⚠️ No CORS configuration found')
      } else {
        throw error
      }
    }

    // Set proper CORS configuration
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'], // Allow all origins for now
          ExposeHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'x-amz-version-id'
          ],
          MaxAgeSeconds: 3000
        }
      ]
    }

    console.log('\n✅ Setting CORS configuration...')
    const putCorsCommand = new PutBucketCorsCommand({
      Bucket: s3Config.bucket,
      CORSConfiguration: corsConfiguration
    })

    await client.send(putCorsCommand)
    console.log('✅ CORS configuration updated successfully!')

    // Verify
    const verifyCommand = new GetBucketCorsCommand({
      Bucket: s3Config.bucket
    })
    const updatedCors = await client.send(verifyCommand)
    console.log('\n📋 Updated CORS configuration:')
    console.log(JSON.stringify(updatedCors.CORSRules, null, 2))

    console.log('\n✅ CORS setup complete! Your S3 bucket is now configured for browser uploads.')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupCORS()