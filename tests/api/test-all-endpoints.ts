#!/usr/bin/env tsx

/**
 * Comprehensive API Testing Script
 * Tests all API endpoints with real-world scenarios
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = 'http://localhost:3000'

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
}

// Test results tracking
const testResults: any = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: Date.now()
}

// Helper function to make API requests
async function apiRequest(
  method: string,
  endpoint: string,
  options: {
    body?: any
    headers?: Record<string, string>
    query?: Record<string, any>
  } = {}
) {
  const url = new URL(`${API_BASE}${endpoint}`)
  
  // Add query parameters
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
  }
  
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }
  
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body)
  }
  
  try {
    const response = await fetch(url.toString(), fetchOptions)
    const data = await response.json().catch(() => null)
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    }
  } catch (error: any) {
    return {
      status: 500,
      ok: false,
      data: null,
      error: error.message
    }
  }
}

// Test runner with debug mode
async function runTest(name: string, testFn: () => Promise<boolean | { passed: boolean, debug?: string }>) {
  testResults.total++
  process.stdout.write(`  Testing ${name}... `)
  
  try {
    const result = await testFn()
    const passed = typeof result === 'boolean' ? result : result.passed
    const debug = typeof result === 'object' ? result.debug : undefined
    
    if (passed) {
      testResults.passed++
      console.log(`${colors.green}✓${colors.reset}`)
    } else {
      testResults.failed++
      console.log(`${colors.red}✗${colors.reset}`)
      if (debug) {
        console.log(`    ${colors.yellow}Debug: ${debug}${colors.reset}`)
      }
    }
    return passed
  } catch (error: any) {
    testResults.failed++
    testResults.errors.push({ test: name, error: error.message })
    console.log(`${colors.red}✗ (Error: ${error.message})${colors.reset}`)
    return false
  }
}

// Test categories
async function testPublicEndpoints() {
  console.log(`\n${colors.cyan}📍 Testing Public Endpoints${colors.reset}`)
  
  await runTest('Health Check', async () => {
    const res = await apiRequest('GET', '/api/system/health')
    return res.status === 200 && res.data?.data?.status === 'healthy'
  })
  
  await runTest('Public Search', async () => {
    const res = await apiRequest('GET', '/api/search', {
      query: { q: 'test', limit: 10 }
    })
    return {
      passed: res.status === 200,
      debug: `Status: ${res.status}, Response: ${JSON.stringify(res.data?.error || res.data?.message || 'Unknown')}`
    }
  })
  
  await runTest('Public Assets List', async () => {
    const res = await apiRequest('GET', '/api/assets', {
      query: { page: 1, limit: 5 }
    })
    return res.status === 200
  })
  
  await runTest('Placeholder Image', async () => {
    const res = await apiRequest('GET', '/api/placeholder/200/200')
    return res.status === 200
  })
}

async function testAuthenticationFlow() {
  console.log(`\n${colors.cyan}🔐 Testing Authentication Flow${colors.reset}`)
  
  const testEmail = `test.user.${Date.now()}@example.com`
  let resetToken = ''
  
  await runTest('User Registration', async () => {
    const res = await apiRequest('POST', '/api/auth/register', {
      body: {
        email: testEmail,
        password: 'TestPassword@123',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER'
      }
    })
    return res.status === 201
  })
  
  await runTest('Registration Rate Limiting', async () => {
    // Try multiple rapid registrations
    const promises = []
    for (let i = 0; i < 10; i++) {
      promises.push(
        apiRequest('POST', '/api/auth/register', {
          body: {
            email: `ratelimit${i}@example.com`,
            password: 'Test@123',
            firstName: 'Rate',
            lastName: 'Limit',
            role: 'USER'
          }
        })
      )
    }
    const results = await Promise.all(promises)
    const rateLimited = results.filter(r => r.status === 429)
    return rateLimited.length > 0
  })
  
  await runTest('Forgot Password', async () => {
    const res = await apiRequest('POST', '/api/auth/forgot-password', {
      body: { email: testEmail }
    })
    return res.status === 200
  })
  
  await runTest('Reset Password Token Validation', async () => {
    const res = await apiRequest('GET', '/api/auth/reset-password', {
      query: { token: 'invalid-token' }
    })
    return res.status === 400
  })
}

async function testProtectedEndpoints() {
  console.log(`\n${colors.cyan}🔒 Testing Protected Endpoints (Auth Required)${colors.reset}`)
  
  // These should all return 401 without authentication
  const endpoints = [
    { method: 'GET', path: '/api/profile' },
    { method: 'GET', path: '/api/activity' },
    { method: 'GET', path: '/api/notifications' },
    { method: 'GET', path: '/api/collections' },
    { method: 'GET', path: '/api/analytics/overview' },
    { method: 'GET', path: '/api/users' },
    { method: 'GET', path: '/api/categories/stats' }
  ]
  
  for (const endpoint of endpoints) {
    await runTest(`${endpoint.method} ${endpoint.path}`, async () => {
      const res = await apiRequest(endpoint.method, endpoint.path)
      return res.status === 401
    })
  }
}

async function testAssetOperations() {
  console.log(`\n${colors.cyan}📁 Testing Asset Operations${colors.reset}`)
  
  // Test without auth (should work for public endpoints)
  await runTest('List Assets (No Auth)', async () => {
    const res = await apiRequest('GET', '/api/assets')
    return res.status === 200 && res.data?.success === true
  })
  
  // Test asset operations that require auth
  await runTest('Upload Prepare (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/assets/upload/prepare', {
      body: {
        fileName: 'test.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg'
      }
    })
    return res.status === 401
  })
  
  await runTest('Batch Download (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/assets/batch-download', {
      body: { assetIds: ['test-id'] }
    })
    return res.status === 401
  })
}

async function testSearchAndDiscovery() {
  console.log(`\n${colors.cyan}🔍 Testing Search and Discovery${colors.reset}`)
  
  await runTest('Basic Search', async () => {
    const res = await apiRequest('GET', '/api/search', {
      query: { q: 'test' }
    })
    return res.status === 200
  })
  
  await runTest('Search with Filters', async () => {
    const res = await apiRequest('GET', '/api/search', {
      query: {
        q: 'test',
        type: 'IMAGE',
        category: 'Marketing'
      }
    })
    return res.status === 200
  })
  
  await runTest('Advanced Search (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/search/advanced', {
      body: {
        query: 'test',
        filters: { type: ['IMAGE'] }
      }
    })
    return res.status === 401
  })
}

async function testCollectionOperations() {
  console.log(`\n${colors.cyan}📚 Testing Collection Operations${colors.reset}`)
  
  await runTest('List Collections (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/collections')
    return res.status === 401
  })
  
  await runTest('Create Collection (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/collections', {
      body: {
        name: 'Test Collection',
        description: 'Test'
      }
    })
    return res.status === 401
  })
}

async function testReviewWorkflow() {
  console.log(`\n${colors.cyan}✅ Testing Review Workflow${colors.reset}`)
  
  await runTest('Get Pending Reviews (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/reviews/pending')
    return res.status === 401
  })
}

async function testAnalytics() {
  console.log(`\n${colors.cyan}📊 Testing Analytics Endpoints${colors.reset}`)
  
  const analyticsEndpoints = [
    '/api/analytics/overview',
    '/api/analytics/file-types',
    '/api/analytics/top-content',
    '/api/analytics/trends',
    '/api/categories/stats'
  ]
  
  for (const endpoint of analyticsEndpoints) {
    await runTest(`GET ${endpoint}`, async () => {
      const res = await apiRequest('GET', endpoint)
      return res.status === 401 // All require auth
    })
  }
}

async function testNotifications() {
  console.log(`\n${colors.cyan}🔔 Testing Notification System${colors.reset}`)
  
  await runTest('Get Notifications (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/notifications')
    return res.status === 401
  })
  
  await runTest('Mark All Read (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/notifications/mark-all-read')
    return res.status === 401
  })
  
  await runTest('Get Preferences (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/notifications/preferences')
    return res.status === 401
  })
}

async function testUserManagement() {
  console.log(`\n${colors.cyan}👥 Testing User Management${colors.reset}`)
  
  await runTest('Get Profile (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/profile')
    return res.status === 401
  })
  
  await runTest('Update Profile (Requires Auth)', async () => {
    const res = await apiRequest('PATCH', '/api/profile', {
      body: { firstName: 'Updated' }
    })
    return res.status === 401
  })
  
  await runTest('List Users (Admin Only)', async () => {
    const res = await apiRequest('GET', '/api/users')
    return res.status === 401
  })
}

async function testSharing() {
  console.log(`\n${colors.cyan}🔗 Testing Share Links${colors.reset}`)
  
  await runTest('Access Invalid Share Link', async () => {
    const res = await apiRequest('GET', '/api/share/invalid-token')
    return res.status === 404
  })
  
  await runTest('Verify Share Password', async () => {
    const res = await apiRequest('POST', '/api/share/invalid-token/verify', {
      body: { password: 'test' }
    })
    return res.status === 404
  })
}

async function testSystemEndpoints() {
  console.log(`\n${colors.cyan}⚙️ Testing System Endpoints${colors.reset}`)
  
  await runTest('Health Check', async () => {
    const res = await apiRequest('GET', '/api/system/health')
    return res.status === 200
  })
  
  await runTest('System Metrics (Admin Only)', async () => {
    const res = await apiRequest('GET', '/api/system/metrics')
    return res.status === 401
  })
  
  await runTest('Job Queue Status (Admin Only)', async () => {
    const res = await apiRequest('GET', '/api/system/jobs')
    return res.status === 401
  })
  
  await runTest('System Errors (Admin Only)', async () => {
    const res = await apiRequest('GET', '/api/system/errors')
    return res.status === 401
  })
}

async function testTags() {
  console.log(`\n${colors.cyan}🏷️ Testing Tags Management${colors.reset}`)
  
  await runTest('List Tags (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/tags')
    return res.status === 401
  })
  
  await runTest('Create Tag (Requires Auth)', async () => {
    const res = await apiRequest('POST', '/api/tags', {
      body: { name: 'Test Tag', category: 'CUSTOM' }
    })
    return res.status === 401
  })
  
  await runTest('Get Tag Suggestions (Requires Auth)', async () => {
    const res = await apiRequest('GET', '/api/tags/suggestions')
    return res.status === 401
  })
}

// Main test runner
async function main() {
  console.log(`${colors.bright}${colors.magenta}
╔════════════════════════════════════════════════════╗
║         CONTENT HUB API TEST SUITE                ║
║         Testing All Endpoints                      ║
╚════════════════════════════════════════════════════╝
${colors.reset}`)
  
  console.log(`📅 Date: ${new Date().toISOString()}`)
  console.log(`🌐 API Base: ${API_BASE}`)
  console.log(`═══════════════════════════════════════════════════`)
  
  // Check if server is running
  console.log(`\n${colors.yellow}Checking server status...${colors.reset}`)
  try {
    const health = await apiRequest('GET', '/api/system/health')
    if (health.status === 200) {
      console.log(`${colors.green}✅ Server is running and healthy${colors.reset}`)
    } else {
      throw new Error('Server health check failed')
    }
  } catch (error) {
    console.log(`${colors.red}❌ Server is not accessible. Please start the server first.${colors.reset}`)
    console.log(`Run: ${colors.cyan}npm run dev${colors.reset}`)
    process.exit(1)
  }
  
  // Run all test categories
  await testPublicEndpoints()
  await testAuthenticationFlow()
  await testProtectedEndpoints()
  await testAssetOperations()
  await testSearchAndDiscovery()
  await testCollectionOperations()
  await testReviewWorkflow()
  await testAnalytics()
  await testNotifications()
  await testUserManagement()
  await testSharing()
  await testSystemEndpoints()
  await testTags()
  
  // Print results
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2)
  
  console.log(`\n${colors.bright}═══════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.bright}                  TEST RESULTS                     ${colors.reset}`)
  console.log(`${colors.bright}═══════════════════════════════════════════════════${colors.reset}`)
  
  console.log(`\n📊 Summary:`)
  console.log(`   Total Tests: ${testResults.total}`)
  console.log(`   ${colors.green}Passed: ${testResults.passed}${colors.reset}`)
  console.log(`   ${colors.red}Failed: ${testResults.failed}${colors.reset}`)
  console.log(`   Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)
  console.log(`   Duration: ${duration}s`)
  
  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}❌ Errors:${colors.reset}`)
    testResults.errors.forEach((err: any) => {
      console.log(`   - ${err.test}: ${err.error}`)
    })
  }
  
  // Save results to file
  const resultsFile = 'test-results.json'
  const fs = await import('fs/promises')
  await fs.writeFile(resultsFile, JSON.stringify(testResults, null, 2)).catch(() => {})
  console.log(`\n📄 Results saved to ${resultsFile}`)
  
  // Exit with appropriate code
  const exitCode = testResults.failed > 0 ? 1 : 0
  
  if (exitCode === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All tests passed successfully!${colors.reset}`)
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Some tests failed. Please review the errors above.${colors.reset}`)
  }
  
  await prisma.$disconnect()
  process.exit(exitCode)
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled rejection:${colors.reset}`, error)
  process.exit(1)
})

// Run tests
main().catch((error) => {
  console.error(`${colors.red}Test execution failed:${colors.reset}`, error)
  process.exit(1)
})