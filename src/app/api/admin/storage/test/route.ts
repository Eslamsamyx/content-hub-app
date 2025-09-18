import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ConfigurationService } from '@/lib/config-service'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get S3 configuration from database
    const s3Config = await ConfigurationService.getS3Config()
    
    if (!s3Config || !s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.bucket) {
      return NextResponse.json(
        { 
          error: 'S3 configuration not found or incomplete. Please configure S3 settings first.',
          missingFields: {
            accessKeyId: !s3Config?.accessKeyId,
            secretAccessKey: !s3Config?.secretAccessKey,
            bucket: !s3Config?.bucket
          }
        },
        { status: 400 }
      )
    }
    
    // Create a temporary S3 client for testing using database config
    const { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    
    const testClient = new S3Client({
      region: s3Config.region || 'us-east-1',
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    })
    
    try {
      // Test 1: Check if bucket exists and is accessible
      const headCommand = new HeadBucketCommand({ Bucket: s3Config.bucket })
      await testClient.send(headCommand)
      
      // Test 2: Try to write a test file
      const testKey = `.content-hub-test-${Date.now()}.txt`
      const putCommand = new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: testKey,
        Body: 'Content Hub S3 Test',
        ContentType: 'text/plain',
      })
      await testClient.send(putCommand)
      
      // Test 3: Try to read the test file
      const getCommand = new GetObjectCommand({
        Bucket: s3Config.bucket,
        Key: testKey,
      })
      await testClient.send(getCommand)
      
      // Test 4: Clean up - delete the test file
      const deleteCommand = new DeleteObjectCommand({
        Bucket: s3Config.bucket,
        Key: testKey,
      })
      await testClient.send(deleteCommand)
      
      return NextResponse.json({
        success: true,
        message: `Successfully connected to S3 bucket "${s3Config.bucket}"`,
        permissions: {
          read: true,
          write: true,
          delete: true
        },
        bucket: s3Config.bucket,
        region: s3Config.region
      })
    } catch (error: any) {
      let errorMessage = 'Failed to connect to S3'
      
      if (error.name === 'NoSuchBucket') {
        errorMessage = `Bucket "${s3Config.bucket}" does not exist`
      } else if (error.name === 'AccessDenied' || error.name === 'Forbidden') {
        errorMessage = `Access denied. Check IAM permissions for bucket "${s3Config.bucket}"`
      } else if (error.name === 'InvalidAccessKeyId') {
        errorMessage = 'Invalid AWS Access Key ID'
      } else if (error.name === 'SignatureDoesNotMatch') {
        errorMessage = 'Invalid AWS Secret Access Key'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: error.name
      })
    }
  } catch (error: any) {
    console.error('Error testing S3 connection:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to test S3 connection' 
      },
      { status: 500 }
    )
  }
}