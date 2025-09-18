#!/usr/bin/env node

// Quick test to check S3 configuration
const http = require('http');

console.log('Checking S3 configuration...\n');

// Check storage config endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/storage/config',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.configured) {
        console.log('✅ S3 is configured!');
        console.log(`   Provider: ${parsed.provider}`);
        console.log(`   Bucket: ${parsed.bucket}`);
        console.log(`   Region: ${parsed.region}`);
      } else {
        console.log('❌ S3 is not configured');
        console.log('   Please configure S3 in the admin panel');
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
  console.log('\nMake sure the server is running on port 3000');
});

req.end();