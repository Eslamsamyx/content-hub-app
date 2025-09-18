#!/usr/bin/env node

/**
 * Test upload with working authentication
 */

const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const FormData = require('form-data');

const prisma = new PrismaClient();

async function testUploadWithDB() {
  console.log('Testing upload with database authentication...\n');
  
  try {
    // Get admin user from database
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@contenthub.com'
      }
    });
    
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.email);
    
    // Get S3 config
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 's3_config' }
    });
    
    if (!config) {
      console.error('S3 configuration not found');
      return;
    }
    
    // Import required modules
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const crypto = require('crypto');
    const { nanoid } = require('nanoid');
    
    // Decrypt S3 config
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
    const uploadId = nanoid();
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const fileName = `assets/${timestamp}/${uploadId}-test-upload.txt`;
    
    console.log('\n📤 Uploading file to S3...');
    console.log(`   Bucket: ${s3Config.bucket}`);
    console.log(`   Key: ${fileName}`);
    
    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: fileName,
      Body: fileContent,
      ContentType: 'text/plain',
      Metadata: {
        'uploaded-by': adminUser.email,
        'upload-date': new Date().toISOString(),
        'upload-id': uploadId
      }
    });
    
    await s3Client.send(putCommand);
    console.log('✅ File uploaded to S3');
    
    // Create asset record
    const asset = await prisma.asset.create({
      data: {
        title: 'Test Upload - Working Method',
        description: 'Upload test using working authentication',
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
        uploadedById: adminUser.id,
        batchId: uploadId
      }
    });
    
    console.log('\n✅ Upload successful!');
    console.log('='.repeat(50));
    console.log('Asset created:');
    console.log(`  ID: ${asset.id}`);
    console.log(`  Title: ${asset.title}`);
    console.log(`  S3 Key: ${asset.fileKey}`);
    console.log(`  Size: ${asset.fileSize} bytes`);
    
    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'ASSET_UPLOADED',
        description: `Uploaded ${asset.title}`,
        userId: adminUser.id,
        assetId: asset.id,
        metadata: {
          fileSize: Number(asset.fileSize),
          mimeType: asset.mimeType,
          originalFilename: asset.originalFilename,
        },
      },
    });
    
    console.log('\n📊 Activity logged');
    
    // Verify the upload
    console.log('\n🔍 Verifying upload...');
    const verifyAsset = await prisma.asset.findUnique({
      where: { id: asset.id },
      include: {
        uploadedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            downloads: true,
            favorites: true
          }
        }
      }
    });
    
    if (verifyAsset) {
      console.log('✅ Asset verified in database');
      console.log(`   Uploaded by: ${verifyAsset.uploadedBy.email}`);
      console.log(`   Downloads: ${verifyAsset._count.downloads}`);
      console.log(`   Favorites: ${verifyAsset._count.favorites}`);
    }
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testUploadWithDB();