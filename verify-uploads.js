#!/usr/bin/env node

/**
 * Verify uploaded files in S3 and database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUploads() {
  console.log('Verifying uploaded files...\n');
  
  try {
    // Get recent assets from database
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        uploadedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`Found ${assets.length} recent assets in database:\n`);
    
    if (assets.length === 0) {
      console.log('No assets found in database.');
      return;
    }
    
    // Get S3 configuration
    const config = await prisma.systemConfiguration.findUnique({
      where: { key: 's3_config' }
    });
    
    if (!config) {
      console.error('No S3 configuration found');
      return;
    }
    
    const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const crypto = require('crypto');
    
    // Decrypt config
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
    
    // Verify each asset
    for (const asset of assets) {
      console.log('─'.repeat(60));
      console.log(`📄 Asset: ${asset.title}`);
      console.log(`   ID: ${asset.id}`);
      console.log(`   Type: ${asset.type}`);
      console.log(`   Category: ${asset.category}`);
      console.log(`   File: ${asset.filename} (${(Number(asset.fileSize) / 1024).toFixed(2)} KB)`);
      console.log(`   S3 Key: ${asset.fileKey}`);
      console.log(`   Upload Status: ${asset.uploadStatus}`);
      console.log(`   Processing Status: ${asset.processingStatus}`);
      console.log(`   Uploaded by: ${asset.uploadedBy?.email || 'Unknown'}`);
      console.log(`   Created: ${asset.createdAt.toLocaleString()}`);
      
      // Verify file exists in S3
      if (asset.fileKey) {
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: s3Config.bucket,
            Key: asset.fileKey
          });
          
          const metadata = await s3Client.send(headCommand);
          console.log(`   ✅ S3 Status: File exists (${(metadata.ContentLength / 1024).toFixed(2)} KB)`);
          
          // For recent test uploads, also fetch content
          if (asset.fileKey.includes('test-upload')) {
            const getCommand = new GetObjectCommand({
              Bucket: s3Config.bucket,
              Key: asset.fileKey
            });
            const response = await s3Client.send(getCommand);
            const content = await streamToString(response.Body);
            console.log(`   📝 Content preview: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
          }
        } catch (error) {
          if (error.name === 'NotFound') {
            console.log(`   ❌ S3 Status: File not found`);
          } else {
            console.log(`   ⚠️ S3 Status: Error checking file - ${error.name}`);
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total assets in database: ${assets.length}`);
    console.log(`   S3 Bucket: ${s3Config.bucket}`);
    console.log(`   S3 Region: ${s3Config.region}`);
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Run verification
verifyUploads();