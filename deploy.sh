#!/bin/bash

# Deployment script for Content Hub on VPS

echo "🚀 Starting deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Create logs directory if it doesn't exist
mkdir -p logs

# Copy static files and public directory
echo "📁 Copying static files..."
cp -r public ./.next/standalone/
cp -r .next/static ./.next/standalone/.next/

# Stop existing PM2 process if running
echo "🛑 Stopping existing process..."
pm2 stop content-hub || true
pm2 delete content-hub || true

# Start the application with PM2
echo "✅ Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo "✨ Deployment complete!"
echo "🌐 Application running on http://localhost:3000"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs content-hub"