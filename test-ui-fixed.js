#!/usr/bin/env node

/**
 * Test the fixed UI upload flow
 */

const fs = require('fs');

async function testFixedUIFlow() {
  console.log('Testing fixed UI upload flow...\n');
  
  try {
    // Use the session from the browser (you'll need to be logged in)
    // For testing, we'll authenticate programmatically
    console.log('1. Getting session...');
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const sessionData = await sessionResponse.json();
    
    if (!sessionData || !sessionData.user) {
      console.log('No active session. Logging in...');
      
      // Get CSRF token
      const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      
      // Login
      await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@contenthub.com',
          password: 'Test@123',
          csrfToken: csrfData.csrfToken
        })
      });
    }
    
    // Step 2: Prepare upload
    console.log('\n2. Preparing upload...');
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
    const prepareResult = await prepareResponse.json();
    
    if (!prepareResult.success) {
      console.error('❌ Failed to prepare upload:', prepareResult.error);
      return;
    }
    
    const { uploadId, uploadUrl, fileKey } = prepareResult.data;
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
    
    // Step 4: Complete upload with FIXED structure
    console.log('\n4. Completing upload (with fixed structure)...');
    const completePayload = {
      uploadId,
      fileKey,
      metadata: {
        title: 'Fixed UI Test Upload',
        description: 'Testing with fixed data structure',
        category: 'Test',
        tags: ['test', 'fixed'],
        company: 'Test Company',
        eventName: 'Test Event',
        usage: 'internal',
        readyForPublishing: false
      },
      fileSize: fileStats.size,
      mimeType: 'text/plain',
      originalFilename: 'test-upload.txt'
    };
    
    console.log('Sending payload:', JSON.stringify(completePayload, null, 2));
    
    const completeResponse = await fetch('http://localhost:3000/api/assets/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completePayload),
      credentials: 'include'
    });
    
    const completeResult = await completeResponse.json();
    
    if (!completeResult.success) {
      console.error('❌ Failed to complete upload:', completeResult.error);
      return;
    }
    
    console.log('\n✅ Upload completed successfully!');
    console.log('='.repeat(60));
    console.log('🎉 UI UPLOAD FLOW NOW WORKS!');
    console.log('='.repeat(60));
    console.log('\nAsset created:');
    console.log(`  ID: ${completeResult.data.asset.id}`);
    console.log(`  Title: ${completeResult.data.asset.title}`);
    console.log(`  S3 Key: ${completeResult.data.asset.fileKey}`);
    console.log(`  Status: ${completeResult.data.asset.uploadStatus}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFixedUIFlow();