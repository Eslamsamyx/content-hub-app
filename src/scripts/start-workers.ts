#!/usr/bin/env node
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { startWorkers } from '../workers'

console.log('Starting Content Hub background workers...')
console.log(`Redis: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`)

// Start all workers
startWorkers()

console.log('Workers starting... Press Ctrl+C to stop.')

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down gracefully...')
  process.exit(0)
})