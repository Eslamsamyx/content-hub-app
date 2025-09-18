#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

console.log(`${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════╗
║     CONTENT HUB API - COMPREHENSIVE TEST SUITE    ║
╚════════════════════════════════════════════════════╝
${colors.reset}`)

// Check if server is running
async function checkServer() {
  console.log(`${colors.yellow}🔍 Checking if server is running...${colors.reset}`)
  
  try {
    const response = await fetch('http://localhost:3000/api/system/health')
    if (response.ok) {
      console.log(`${colors.green}✅ Server is running${colors.reset}`)
      return true
    }
  } catch (error) {
    console.log(`${colors.red}❌ Server is not running${colors.reset}`)
    return false
  }
}

// Start the server if not running
async function startServer() {
  console.log(`${colors.yellow}🚀 Starting development server...${colors.reset}`)
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })
    
    server.stdout?.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready') || output.includes('started server')) {
        console.log(`${colors.green}✅ Server started successfully${colors.reset}`)
        setTimeout(() => resolve(server), 2000) // Wait for server to be fully ready
      }
    })
    
    server.stderr?.on('data', (data) => {
      console.error(`Server error: ${data}`)
    })
  })
}

// Run the actual tests
async function runTests() {
  console.log(`\n${colors.blue}${colors.bright}🧪 Running API Tests...${colors.reset}\n`)
  
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', ['tsx', 'tests/api/comprehensive-api-test.ts'], {
      stdio: 'inherit',
      shell: true
    })
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Tests failed with code ${code}`))
      }
    })
  })
}

// Generate test report
function generateReport(startTime: number) {
  const duration = Date.now() - startTime
  const minutes = Math.floor(duration / 60000)
  const seconds = ((duration % 60000) / 1000).toFixed(2)
  
  console.log(`\n${colors.cyan}${colors.bright}
╔════════════════════════════════════════════════════╗
║                  TEST SUMMARY                      ║
╚════════════════════════════════════════════════════╝
${colors.reset}`)
  
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`)
  console.log(`📊 Reports generated:`)
  console.log(`   - API_ENDPOINTS.md`)
  console.log(`   - api-endpoints.json`)
  console.log(`   - test-results.json (if tests passed)`)
}

// Main execution
async function main() {
  const startTime = Date.now()
  let server: any = null
  
  try {
    // Check if server is running
    const serverRunning = await checkServer()
    
    if (!serverRunning) {
      server = await startServer()
    }
    
    // Run tests
    await runTests()
    
    console.log(`\n${colors.green}${colors.bright}✅ All tests completed successfully!${colors.reset}`)
    
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bright}❌ Test execution failed!${colors.reset}`)
    console.error(error.message)
    process.exit(1)
  } finally {
    // Generate report
    generateReport(startTime)
    
    // Clean up
    if (server) {
      console.log(`\n${colors.yellow}Stopping test server...${colors.reset}`)
      server.kill()
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}Test execution interrupted${colors.reset}`)
  process.exit(0)
})

// Run the main function
main().catch(console.error)