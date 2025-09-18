#!/usr/bin/env node

/**
 * Test the upload flow as the UI would do it
 */

const fs = require('fs');

async function testUIUploadFlow() {
  console.log('Testing UI upload flow...\n');
  
  try {
    // Step 1: Login to get session
    console.log('1. Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@contenthub.com',
        password: 'Test@123'
      }),
      credentials: 'include'
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed, trying NextAuth endpoint...');
      
      // Try NextAuth CSRF token first
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      
      // Try NextAuth credentials provider
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
      
      if (!authResponse.ok && authResponse.status !== 302) {
        console.error('Authentication failed:', authResponse.status);
        return;
      }
    }
    
    console.log('✅ Logged in successfully\n');
    
    // Step 2: Prepare upload (get presigned URL)
    console.log('2. Preparing upload...');
    const testFile = '/tmp/test-upload.txt';
    const fileStats = fs.statSync(testFile);
    
    const prepareResponse = await fetch('http://localhost:3000/api/assets/upload/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: 'test-upload.txt',
        fileSize: fileStats.size,
        fileType: 'text/plain'
      }),
      credentials: 'include'
    });
    
    console.log('Prepare response status:', prepareResponse.status);
    const prepareText = await prepareResponse.text();
    console.log('Prepare response:', prepareText);
    
    if (!prepareResponse.ok) {
      console.error('❌ Failed to prepare upload');
      console.error('Response:', prepareText);
      return;
    }
    
    const prepareData = JSON.parse(prepareText);
    
    if (!prepareData.success) {
      console.error('❌ Prepare upload failed:', prepareData.error);
      return;
    }
    
    const { uploadId, uploadUrl, fileKey } = prepareData.data;
    console.log('✅ Upload prepared');
    console.log('   Upload ID:', uploadId);
    console.log('   File Key:', fileKey);
    
    // Step 3: Upload to S3
    console.log('\n3. Uploading to S3...');
    const fileContent = fs.readFileSync(testFile);
    
    const s3Response = await fetch(uploadUrl, {
      method: 'PUT',
      body: fileContent,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
    
    if (!s3Response.ok) {
      console.error('❌ S3 upload failed:', s3Response.status);
      const errorText = await s3Response.text();
      console.error('Error:', errorText);
      return;
    }
    
    console.log('✅ File uploaded to S3');
    
    // Step 4: Complete upload (create database record)
    console.log('\n4. Completing upload...');
    const completeResponse = await fetch('http://localhost:3000/api/assets/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId,
        fileKey,
        metadata: {
          title: 'Test Upload from UI Flow',
          description: 'Testing the complete UI upload flow',
          category: 'Test',
          tags: ['test', 'upload'],
          company: 'Test Company',
          usage: 'internal',
          readyForPublishing: false
        },
        fileSize: fileStats.size,
        mimeType: 'text/plain',
        originalFilename: 'test-upload.txt'
      }),
      credentials: 'include'
    });
    
    if (!completeResponse.ok) {
      const errorText = await completeResponse.text();
      console.error('❌ Failed to complete upload:', completeResponse.status);
      console.error('Error:', errorText);
      return;
    }
    
    const completeData = await completeResponse.json();
    
    if (!completeData.success) {
      console.error('❌ Complete upload failed:', completeData.error);
      return;
    }
    
    console.log('✅ Upload completed successfully!');
    console.log('\n📄 Asset created:');
    console.log('   ID:', completeData.data.asset.id);
    console.log('   Title:', completeData.data.asset.title);
    console.log('   S3 Key:', completeData.data.asset.fileKey);
    console.log('   Status:', completeData.data.asset.uploadStatus);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testUIUploadFlow();