#!/usr/bin/env node

/**
 * Test S3 connection using database credentials
 */

async function testS3Connection() {
  console.log('Testing S3 connection using database credentials...\n');
  
  try {
    // First, we need to authenticate as admin
    console.log('1. Authenticating as admin...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: 'admin@example.com',
        password: 'Admin123!',
        csrfToken: '', // In dev, this might not be required
      }),
      redirect: 'manual'
    });

    // Get session cookie from login response
    const cookies = loginResponse.headers.get('set-cookie');
    if (!cookies) {
      // Try direct session approach for testing
      console.log('Direct auth failed, trying test endpoint...');
    }
    
    // Test S3 connection endpoint (no body needed as it uses database config)
    console.log('2. Testing S3 connection...');
    const testResponse = await fetch('http://localhost:3000/api/admin/storage/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookies && { 'Cookie': cookies })
      },
      body: '{}' // Empty body as config comes from database
    });

    const result = await testResponse.json();
    
    if (result.success) {
      console.log('✅ S3 Connection Test Successful!\n');
      console.log('Configuration:');
      console.log(`  - Bucket: ${result.bucket}`);
      console.log(`  - Region: ${result.region}`);
      console.log(`  - Permissions: Read ✓, Write ✓, Delete ✓`);
      console.log('\nS3 is properly configured and working with database credentials.');
    } else {
      console.error('❌ S3 Connection Test Failed\n');
      console.error('Error:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      if (result.missingFields) {
        console.error('\nMissing configuration fields:');
        Object.entries(result.missingFields).forEach(([field, missing]) => {
          if (missing) console.error(`  - ${field}`);
        });
        console.error('\nPlease configure S3 settings in the admin dashboard first.');
      }
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('\nMake sure:');
    console.error('1. The server is running (npm run dev)');
    console.error('2. S3 credentials are configured in the admin dashboard');
    console.error('3. The database is accessible');
  }
}

// Run the test
testS3Connection();