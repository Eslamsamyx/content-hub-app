#!/bin/bash

# Start script for Content Hub App
# This script handles both development and production modes

echo "Starting Content Hub App..."

# Check if .next/standalone exists
if [ -d ".next/standalone" ]; then
    echo "Starting in production mode with standalone server..."
    PORT=${PORT:-3000} NODE_ENV=production node .next/standalone/server.js
else
    echo "Standalone build not found. Please run 'npm run build' first."
    echo "Or use 'npm run dev' for development mode."
    exit 1
fi