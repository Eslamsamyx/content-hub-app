#!/usr/bin/env node

/**
 * Test the complete UI upload flow with proper authentication
 */

const fs = require('fs');
const https = require('https');

async function testCompleteUIFlow() {
  console.log('Testing complete UI upload flow...\n');
  
  try {
    // Step 1: Get CSRF token and login
    console.log('1. Authenticating...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    
    const authResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@contenthub.com',
        password: 'Test@123',
        csrfToken: csrfData.csrfToken
      }),
      credentials: 'include',
      redirect: 'manual'
    });
    
    // Get all cookies
    const setCookieHeader = authResponse.headers.get('set-cookie');
    const cookies = setCookieHeader ? setCookieHeader.split(',').map(c => c.trim()) : [];
    
    // Find session token
    let sessionCookie = '';
    for (const cookie of cookies) {
      if (cookie.includes('next-auth.session-token')) {
        sessionCookie = cookie.split(';')[0];
        break;
      }
    }
    
    if (!sessionCookie) {
      console.error('No session cookie found');
      return;
    }
    
    console.log('✅ Authenticated successfully');
    console.log('   Session:', sessionCookie.substring(0, 50) + '...');
    
    // Step 2: Prepare upload (get presigned URL)
    console.log('\n2. Preparing upload...');
    const testFile = '/tmp/test-upload.txt';
    const fileStats = fs.statSync(testFile);
    
    const prepareResponse = await fetch('http://localhost:3000/api/assets/upload/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        fileName: 'test-upload.txt',
        fileSize: fileStats.size,
        fileType: 'text/plain'
      })
    });
    
    const prepareResult = await prepareResponse.json();
    
    if (!prepareResult.success) {
      console.error('❌ Failed to prepare upload:', prepareResult.error);
      return;
    }
    
    const { uploadId, uploadUrl, fileKey } = prepareResult.data;
    console.log('✅ Upload prepared');
    console.log('   Upload ID:', uploadId);
    console.log('   File Key:', fileKey);
    console.log('   Upload URL:', uploadUrl.substring(0, 100) + '...');
    
    // Step 3: Upload to S3 using presigned URL
    console.log('\n3. Uploading to S3...');
    const fileContent = fs.readFileSync(testFile);
    
    // Parse the S3 URL
    const urlObj = new URL(uploadUrl);
    
    // Make the PUT request to S3
    const s3Response = await new Promise((resolve, reject) => {
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'PUT',
        headers: {
          'Content-Type': 'text/plain',
          'Content-Length': fileContent.length
        }
      };
      
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.write(fileContent);
      req.end();
    });
    
    if (s3Response.status !== 200) {
      console.error('❌ S3 upload failed:', s3Response.status);
      console.error('Response:', s3Response.body);
      return;
    }
    
    console.log('✅ File uploaded to S3');
    
    // Step 4: Complete upload (create database record)
    console.log('\n4. Completing upload...');
    const completeResponse = await fetch('http://localhost:3000/api/assets/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        uploadId,
        fileKey,
        metadata: {
          title: 'UI Flow Test Upload',
          description: 'Testing complete UI upload flow',
          category: 'Test',
          tags: ['test', 'ui-flow'],
          company: 'Test Company',
          eventName: 'Test Event',
          usage: 'internal',
          readyForPublishing: false
        },
        fileSize: fileStats.size,
        mimeType: 'text/plain',
        originalFilename: 'test-upload.txt'
      })
    });
    
    const completeResult = await completeResponse.json();
    
    if (!completeResult.success) {
      console.error('❌ Failed to complete upload:', completeResult.error);
      return;
    }
    
    console.log('✅ Upload completed successfully!');
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL UI UPLOAD FLOW SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\nAsset created:');
    console.log(`  ID: ${completeResult.data.asset.id}`);
    console.log(`  Title: ${completeResult.data.asset.title}`);
    console.log(`  S3 Key: ${completeResult.data.asset.fileKey}`);
    console.log(`  Status: ${completeResult.data.asset.uploadStatus}`);
    console.log(`  Processing: ${completeResult.data.asset.processingStatus}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testCompleteUIFlow();