#!/usr/bin/env node

/**
 * Test direct file upload endpoint
 */

const fs = require('fs');
const FormData = require('form-data');

async function testDirectUpload() {
  console.log('Testing direct upload endpoint...\n');
  
  try {
    // Step 1: Get CSRF token
    console.log('1. Getting CSRF token...');
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    
    // Step 2: Login
    console.log('2. Logging in...');
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
      redirect: 'manual'
    });
    
    // Get cookies from response
    const cookies = authResponse.headers.get('set-cookie');
    if (!cookies) {
      console.error('No session cookie received');
      return;
    }
    
    // Extract session token
    const sessionToken = cookies.match(/next-auth\.session-token=([^;]+)/)?.[1];
    if (!sessionToken) {
      console.error('No session token found');
      return;
    }
    
    console.log('✅ Logged in successfully\n');
    
    // Step 3: Upload file
    console.log('3. Uploading file...');
    const testFile = '/tmp/test-upload.txt';
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFile), {
      filename: 'test-upload.txt',
      contentType: 'text/plain'
    });
    formData.append('title', 'Direct Upload Test');
    formData.append('description', 'Testing direct upload endpoint');
    formData.append('category', 'Test');
    formData.append('tags', 'test,direct-upload');
    formData.append('company', 'Test Company');
    formData.append('usage', 'internal');
    formData.append('readyForPublishing', 'false');
    
    const uploadResponse = await fetch('http://localhost:3000/api/assets/upload', {
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'Cookie': `next-auth.session-token=${sessionToken}`
      },
      body: formData
    });
    
    console.log('Upload response status:', uploadResponse.status);
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.error('❌ Upload failed:', uploadResult.error);
      return;
    }
    
    console.log('\n✅ Upload successful!');
    console.log('='.repeat(50));
    console.log('Asset created:');
    console.log(`  ID: ${uploadResult.data.asset.id}`);
    console.log(`  Title: ${uploadResult.data.asset.title}`);
    console.log(`  S3 Key: ${uploadResult.data.asset.fileKey}`);
    console.log(`  Status: ${uploadResult.data.asset.uploadStatus}`);
    console.log(`  Processing: ${uploadResult.data.asset.processingStatus}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testDirectUpload();