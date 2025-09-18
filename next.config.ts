import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  
  // Optimize for production
  experimental: {
    optimizeCss: false,
  },

  // Webpack configuration to suppress BullMQ warnings
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'child_process' module on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        child_process: false,
      }
    }
    
    // Suppress critical dependency warnings from BullMQ
    config.module = config.module || {}
    config.module.exprContextCritical = false
    
    return config
  },
  
  // Image optimization for self-hosted
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      // S3 bucket patterns - supports various S3 URL formats
      {
        protocol: 'https',
        hostname: '*.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.s3.*.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.*.amazonaws.com',
        pathname: '/**',
      },
      // Specific pattern for kayanlive-content bucket
      {
        protocol: 'https',
        hostname: 'kayanlive-content.s3.me-central-1.amazonaws.com',
        pathname: '/**',
      },
      // Generic pattern for content-hub buckets
      {
        protocol: 'https',
        hostname: 'content-hub-*.s3.*.amazonaws.com',
        pathname: '/**',
      }
    ],
    // Add image loading configuration
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Add headers for better error handling and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
    ]
  },
};

export default nextConfig;
