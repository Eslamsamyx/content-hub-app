#!/usr/bin/env node

/**
 * Test file upload functionality with S3
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFileUpload() {
  console.log('Testing file upload with S3 database credentials...\n');
  
  try {
    // First, get an admin user for authentication context
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@contenthub.com'
      }
    });
    
    if (!adminUser) {
      console.error('Admin user not found. Please ensure admin@contenthub.com exists.');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.email);
    
    // Read the test file
    const testFilePath = '/tmp/test-upload.txt';
    if (!fs.existsSync(testFilePath)) {
      console.error('Test file not found at:', testFilePath);
      return;
    }
    
    const fileStats = fs.statSync(testFilePath);
    console.log(`\n📄 Test file: ${testFilePath}`);
    console.log(`   Size: ${fileStats.size} bytes`);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test-upload.txt',
      contentType: 'text/plain'
    });
    formData.append('title', 'Test Upload from Script');
    formData.append('description', 'Testing S3 upload with database credentials');
    formData.append('category', 'Test');
    formData.append('type', 'DOCUMENT');
    formData.append('visibility', 'INTERNAL');
    
    // Make the upload request
    console.log('\n📤 Uploading file to S3...');
    
    const response = await fetch('http://localhost:3000/api/assets/upload', {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        // Simulate authentication by including user context
        'x-user-id': adminUser.id, // This would normally come from session
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      
      // Try direct S3 upload as fallback
      console.log('\n🔄 Attempting direct S3 upload...');
      await directS3Upload();
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ Upload successful!');
    console.log('Asset created:', result);
    
  } catch (error) {
    console.error('❌ Upload test failed:', error.message);
    console.log('\n🔄 Attempting direct S3 upload as fallback...');
    await directS3Upload();
  } finally {
    await prisma.$disconnect();
  }
}

async function directS3Upload() {
  console.log('\nTesting direct S3 upload with database credentials...\n');
  
  try {
    // Get S3 config from database
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 's3_config' }
    });
    
    if (!config) {
      console.error('No S3 configuration found in database');
      return;
    }
    
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const crypto = require('crypto');
    
    // Decrypt config if needed
    let s3Config = config.value;
    if (config.encrypted && s3Config.accessKeyId && typeof s3Config.accessKeyId === 'object') {
      const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY
        ? Buffer.from(process.env.CONFIG_ENCRYPTION_KEY, 'hex')
        : crypto.createHash('sha256').update(
            process.env.NEXTAUTH_SECRET || 'default-key-change-in-production'
          ).digest();
      
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
      
      if (s3Config.accessKeyId && typeof s3Config.accessKeyId === 'object') {
        s3Config.accessKeyId = decrypt(s3Config.accessKeyId);
      }
      if (s3Config.secretAccessKey && typeof s3Config.secretAccessKey === 'object') {
        s3Config.secretAccessKey = decrypt(s3Config.secretAccessKey);
      }
    }
    
    // Create S3 client
    const s3Client = new S3Client({
      region: s3Config.region || 'us-east-1',
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });
    
    // Read test file
    const testFilePath = '/tmp/test-upload.txt';
    const fileContent = fs.readFileSync(testFilePath);
    const fileName = `test-uploads/${Date.now()}-test-upload.txt`;
    
    // Upload to S3
    console.log(`📤 Uploading to S3 bucket: ${s3Config.bucket}`);
    console.log(`   Key: ${fileName}`);
    
    const putCommand = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fileName,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        'uploaded-by': 'content-hub-test',
        'upload-date': new Date().toISOString()
      }
    });
    
    await s3Client.send(putCommand);
    
    console.log('\n✅ Direct S3 upload successful!');
    console.log(`File uploaded to: s3://${s3Config.bucket}/${fileName}`);
    
    // Create database record for the upload
    const asset = await prisma.asset.create({
      data: {
        title: 'Test Upload - Direct S3',
        description: 'Test file uploaded directly to S3',
        filename: 'test-upload.txt',
        originalFilename: 'test-upload.txt',
        fileKey: fileName,
        fileSize: fileContent.length,
        mimeType: 'text/plain',
        format: 'txt',
        type: 'DOCUMENT',
        category: 'Test',
        visibility: 'INTERNAL',
        usage: 'INTERNAL',
        uploadStatus: 'COMPLETED',
        processingStatus: 'COMPLETED',
        uploadedById: (await prisma.user.findFirst({ where: { email: 'admin@contenthub.com' }}))?.id || '',
      }
    });
    
    console.log('\n📊 Asset record created in database:');
    console.log(`   ID: ${asset.id}`);
    console.log(`   Title: ${asset.title}`);
    console.log(`   S3 Key: ${asset.fileKey}`);
    
  } catch (error) {
    console.error('❌ Direct S3 upload failed:', error.message);
    if (error.name === 'NoSuchBucket') {
      console.error('The specified bucket does not exist.');
    } else if (error.name === 'AccessDenied') {
      console.error('Access denied. Check S3 bucket permissions.');
    }
  }
}

// Check if form-data is installed
try {
  require.resolve('form-data');
  testFileUpload();
} catch(e) {
  console.log('Installing required dependency...');
  require('child_process').execSync('npm install form-data', { stdio: 'inherit' });
  console.log('Dependency installed. Please run the script again.');
}