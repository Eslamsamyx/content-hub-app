#!/usr/bin/env node

// Test script for S3 upload functionality
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = 'http://localhost:3002';
const TEST_EMAIL = 'admin@contenthub.com';
const TEST_PASSWORD = 'Test@123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}[Step ${step}]${colors.reset} ${colors.bright}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logError(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

// Create a test image file
function createTestFile() {
  logStep(1, 'Creating test file');
  
  // Create a simple SVG image
  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#4A90E2"/>
  <text x="200" y="150" font-family="Arial" font-size="24" fill="white" text-anchor="middle">
    Test Image for S3 Upload
  </text>
  <text x="200" y="180" font-family="Arial" font-size="16" fill="white" text-anchor="middle">
    ${new Date().toISOString()}
  </text>
</svg>`;
  
  const testFilePath = path.join(__dirname, 'test-image.svg');
  fs.writeFileSync(testFilePath, svgContent);
  logSuccess(`Created test file: ${testFilePath}`);
  
  return testFilePath;
}

// Helper function for HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = client.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Login and get session
async function login() {
  logStep(2, 'Authenticating');
  
  try {
    const body = `email=${encodeURIComponent(TEST_EMAIL)}&password=${encodeURIComponent(TEST_PASSWORD)}&csrfToken=`;
    
    const response = await makeRequest(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      },
      body: body
    });
    
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
      if (sessionCookie) {
        logSuccess(`Authenticated as ${TEST_EMAIL}`);
        return sessionCookie.split(';')[0];
      }
    }
    
    throw new Error('No session cookie received');
  } catch (error) {
    logError(`Authentication failed: ${error.message}`);
    throw error;
  }
}

// Get presigned URL for upload
async function getPresignedUrl(cookies, filename) {
  logStep(3, 'Getting presigned URL');
  
  try {
    const body = JSON.stringify({
      filename: filename,
      contentType: 'image/svg+xml'
    });
    
    const response = await makeRequest(`${BASE_URL}/api/upload/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Content-Length': Buffer.byteLength(body)
      },
      body: body
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`Failed to get presigned URL: ${response.body}`);
    }
    
    const data = JSON.parse(response.body);
    logSuccess('Received presigned URL');
    logInfo(`Upload URL: ${data.uploadUrl.substring(0, 100)}...`);
    logInfo(`File key: ${data.fileKey}`);
    
    return data;
  } catch (error) {
    logError(`Failed to get presigned URL: ${error.message}`);
    throw error;
  }
}

// Upload file to S3
async function uploadToS3(uploadUrl, filePath) {
  logStep(4, 'Uploading to S3');
  
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const response = await makeRequest(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Length': fileContent.length
      },
      body: fileContent
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`S3 upload failed: Status ${response.statusCode}`);
    }
    
    logSuccess('File uploaded to S3 successfully');
    return true;
  } catch (error) {
    logError(`S3 upload failed: ${error.message}`);
    throw error;
  }
}

// Create asset record in database
async function createAssetRecord(cookies, fileKey, filename) {
  logStep(5, 'Creating asset record');
  
  try {
    const fileStats = fs.statSync(path.join(__dirname, filename));
    
    const body = JSON.stringify({
      title: 'Test S3 Upload',
      description: 'Testing S3 upload functionality',
      filename: filename,
      fileKey: fileKey,
      fileSize: fileStats.size,
      mimeType: 'image/svg+xml',
      type: 'IMAGE',
      category: 'Test',
      visibility: 'INTERNAL',
      usage: 'INTERNAL'
    });
    
    const response = await makeRequest(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'Content-Length': Buffer.byteLength(body)
      },
      body: body
    });
    
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      throw new Error(`Failed to create asset record: ${response.body}`);
    }
    
    const data = JSON.parse(response.body);
    logSuccess(`Asset created with ID: ${data.id}`);
    
    return data;
  } catch (error) {
    logError(`Failed to create asset record: ${error.message}`);
    throw error;
  }
}

// Verify upload by fetching asset
async function verifyUpload(cookies, assetId) {
  logStep(6, 'Verifying upload');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/assets/${assetId}`, {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch asset: Status ${response.statusCode}`);
    }
    
    const data = JSON.parse(response.body);
    logSuccess('Asset verified successfully');
    logInfo(`Asset title: ${data.title}`);
    logInfo(`File size: ${data.fileSize} bytes`);
    logInfo(`Upload status: ${data.uploadStatus}`);
    
    if (data.thumbnailUrl) {
      logInfo(`Thumbnail URL: ${data.thumbnailUrl.substring(0, 100)}...`);
    }
    
    return data;
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    throw error;
  }
}

// Cleanup test file
function cleanup(filePath) {
  logStep(7, 'Cleanup');
  
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logSuccess('Test file removed');
    }
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main test function
async function runTest() {
  console.log('\n' + '='.repeat(60));
  log('S3 Upload Test Suite', 'bright');
  console.log('='.repeat(60));
  
  let testFilePath;
  
  try {
    // Create test file
    testFilePath = createTestFile();
    const filename = path.basename(testFilePath);
    
    // Authenticate
    const cookies = await login();
    
    // Get presigned URL
    const { uploadUrl, fileKey } = await getPresignedUrl(cookies, filename);
    
    // Upload to S3
    await uploadToS3(uploadUrl, testFilePath);
    
    // Create asset record
    const asset = await createAssetRecord(cookies, fileKey, filename);
    
    // Verify upload
    await verifyUpload(cookies, asset.id);
    
    console.log('\n' + '='.repeat(60));
    log('✅ All tests passed successfully!', 'green');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    log(`❌ Test failed: ${error.message}`, 'red');
    console.log('='.repeat(60) + '\n');
    process.exit(1);
  } finally {
    if (testFilePath) {
      cleanup(testFilePath);
    }
  }
}

// Run the test
runTest().catch(console.error);