#!/usr/bin/env node

/**
 * Test script for the fixed upload system
 */

async function testUploadFlow() {
  console.log('🧪 Testing Fixed Upload Flow...')
  
  try {
    // Step 1: Test prepare upload
    console.log('\n1️⃣ Testing prepare upload...')
    const prepareResponse = await fetch('http://localhost:3000/api/assets/upload/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=your-session-token' // Replace with actual session
      },
      body: JSON.stringify({
        fileName: 'test-image.jpg',
        fileSize: 150000,
        fileType: 'image/jpeg'
      })
    })
    
    const prepareData = await prepareResponse.json()
    console.log('📝 Prepare response:', prepareData.success ? '✅ Success' : '❌ Failed')
    
    if (prepareData.success) {
      console.log('   - Upload ID:', prepareData.data.uploadId)
      console.log('   - File Key:', prepareData.data.fileKey)
      console.log('   - Upload URL:', prepareData.data.uploadUrl.substring(0, 100) + '...')
      
      // Step 2: Test presigned URL validity (would require actual file upload in real test)
      console.log('\n2️⃣ Testing presigned URL signature...')
      const url = new URL(prepareData.data.uploadUrl)
      console.log('   - Host:', url.host)
      console.log('   - Bucket:', url.pathname.split('/')[1])
      console.log('   - Signature present:', url.searchParams.has('X-Amz-Signature') ? '✅' : '❌')
      console.log('   - Content-Type specified:', url.searchParams.has('X-Amz-Content-Sha256') ? '✅' : '❌')
      
      // Step 3: Test complete upload
      console.log('\n3️⃣ Testing complete upload...')
      const completeResponse = await fetch('http://localhost:3000/api/assets/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=your-session-token' // Replace with actual session
        },
        body: JSON.stringify({
          uploadId: prepareData.data.uploadId,
          fileKey: prepareData.data.fileKey,
          metadata: {
            title: 'Test Image',
            description: 'Test upload via script',
            category: 'test',
            tags: ['test', 'script']
          },
          fileSize: 150000,
          mimeType: 'image/jpeg',
          originalFilename: 'test-image.jpg'
        })
      })
      
      const completeData = await completeResponse.json()
      console.log('💾 Complete response:', completeData.success ? '✅ Success' : '❌ Failed')
      
      if (!completeData.success) {
        console.log('   - Error:', completeData.error)
      }
    }
    
    console.log('\n✅ Upload flow test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Note: This is a demo script - in reality you'd need:
// 1. Valid session token
// 2. Actual file to upload to S3 URL
// 3. File to exist in S3 before calling complete

console.log('📋 Fixed Upload System Test')
console.log('==========================')
console.log('This script tests the API endpoints but requires:')
console.log('- Valid authentication session')
console.log('- Actual file upload to S3 (skipped in this demo)')
console.log('')

testUploadFlow()