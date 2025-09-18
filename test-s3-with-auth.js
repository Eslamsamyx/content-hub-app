#!/usr/bin/env node

/**
 * Test S3 connection with proper authentication
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testS3Directly() {
  console.log('Testing S3 connection by directly accessing database...\n');
  
  try {
    // Get S3 config directly from database
    console.log('1. Fetching S3 configuration from database...');
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 's3_config' }
    });
    
    if (!config) {
      console.error('❌ No S3 configuration found in database');
      console.error('Please configure S3 settings in the admin dashboard first.');
      return;
    }
    
    console.log('✅ Found S3 configuration in database');
    
    // Import AWS SDK
    const { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const crypto = require('crypto');
    
    // Decrypt sensitive fields if needed
    let s3Config = config.value;
    
    // If config is encrypted, we need to decrypt it
    if (config.encrypted && s3Config.accessKeyId && typeof s3Config.accessKeyId === 'object') {
      console.log('Configuration is encrypted, decrypting...');
      
      // Get encryption key
      const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY
        ? Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex')
        : crypto.createHash('sha256').update(
            process.env.NEXTAUTH_SECRET || 'default-key-change-in-production'
          ).digest();
      
      // Decrypt function
      function decrypt(encryptedData) {
        const decipher = crypto.createDecipheriv(
          'aes-256-gcm',
          ENCRYPTION_KEY,
          Buffer.from(encryptedData.iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
      
      // Decrypt sensitive fields
      if (s3Config.accessKeyId && typeof s3Config.accessKeyId === 'object') {
        s3Config.accessKeyId = decrypt(s3Config.accessKeyId);
      }
      if (s3Config.secretAccessKey && typeof s3Config.secretAccessKey === 'object') {
        s3Config.secretAccessKey = decrypt(s3Config.secretAccessKey);
      }
    }
    
    console.log('\n2. Testing S3 connection...');
    console.log(`   Region: ${s3Config.region || 'us-east-1'}`);
    console.log(`   Bucket: ${s3Config.bucket}`);
    
    // Create S3 client
    const s3Client = new S3Client({
      region: s3Config.region || 'us-east-1',
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
    
    // Test 1: Check bucket exists
    console.log('\n3. Checking bucket access...');
    const headCommand = new HeadBucketCommand({ Bucket: s3Config.bucket });
    await s3Client.send(headCommand);
    console.log('✅ Bucket exists and is accessible');
    
    // Test 2: Upload test file
    console.log('\n4. Testing write permissions...');
    const testKey = `.content-hub-test-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: testKey,
      Body: 'Content Hub S3 Test - Database Credentials',
      ContentType: 'text/plain',
    });
    await s3Client.send(putCommand);
    console.log('✅ Successfully uploaded test file');
    
    // Test 3: Read test file
    console.log('\n5. Testing read permissions...');
    const getCommand = new GetObjectCommand({
      Bucket: s3Config.bucket,
      Key: testKey,
    });
    const getResponse = await s3Client.send(getCommand);
    console.log('✅ Successfully read test file');
    
    // Test 4: Delete test file
    console.log('\n6. Testing delete permissions...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: testKey,
    });
    await s3Client.send(deleteCommand);
    console.log('✅ Successfully deleted test file');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 S3 CONNECTION TEST SUCCESSFUL!');
    console.log('='.repeat(50));
    console.log('\nS3 is properly configured with database credentials:');
    console.log(`  ✓ Bucket: ${s3Config.bucket}`);
    console.log(`  ✓ Region: ${s3Config.region || 'us-east-1'}`);
    console.log('  ✓ Read permissions: OK');
    console.log('  ✓ Write permissions: OK');
    console.log('  ✓ Delete permissions: OK');
    
  } catch (error) {
    console.error('\n❌ S3 Connection Test Failed');
    console.error('='.repeat(50));
    
    if (error.name === 'NoSuchBucket') {
      console.error(`Error: Bucket does not exist`);
      console.error('Please create the bucket in AWS S3 first.');
    } else if (error.name === 'AccessDenied' || error.name === 'Forbidden') {
      console.error('Error: Access denied');
      console.error('Please check IAM permissions for the provided credentials.');
    } else if (error.name === 'InvalidAccessKeyId') {
      console.error('Error: Invalid AWS Access Key ID');
      console.error('Please check the Access Key ID in the admin dashboard.');
    } else if (error.name === 'SignatureDoesNotMatch') {
      console.error('Error: Invalid AWS Secret Access Key');
      console.error('Please check the Secret Access Key in the admin dashboard.');
    } else {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error('\nStack trace:', error.stack);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testS3Directly();