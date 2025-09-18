/**
 * Environment Variables Configuration Guide for Content Hub
 *
 * This file documents the EXACT environment variables used by the application.
 * Use this as a reference when deploying to a server.
 *
 * Generated secrets are included as working examples - regenerate for production!
 */

const ENV_VARIABLES = {
  // Database
  DATABASE_URL: {
    required: true,
    example: "postgresql://postgres:password@localhost:5432/content_hub?schema=public",
    description: "PostgreSQL database connection URL",
    production: "Use managed PostgreSQL (AWS RDS, Supabase, DigitalOcean, etc.)"
  },

  // AWS S3 Configuration
  AWS_REGION: {
    required: true,
    example: "us-east-1",
    description: "AWS region for S3 bucket"
  },
  AWS_ACCESS_KEY_ID: {
    required: true,
    example: "your_access_key_here",
    description: "AWS IAM access key ID with S3 permissions"
  },
  AWS_SECRET_ACCESS_KEY: {
    required: true,
    example: "your_secret_key_here",
    description: "AWS IAM secret access key",
    sensitive: true
  },
  AWS_S3_BUCKET: {
    required: true,
    example: "content-hub-assets",
    description: "S3 bucket name for storing uploaded assets"
  },

  // NextAuth Configuration
  NEXTAUTH_SECRET: {
    required: true,
    example: "your-secret-key-here",
    description: "Secret key for NextAuth.js session encryption",
    generate: "openssl rand -base64 32"
  },
  NEXTAUTH_URL: {
    required: true,
    example: "http://localhost:3000",
    description: "Full URL of your application",
    production: "https://yourdomain.com"
  },

  // Application
  NEXT_PUBLIC_APP_URL: {
    required: true,
    example: "http://localhost:3000",
    description: "Public URL of the application (used in frontend)",
    production: "https://yourdomain.com"
  },

  // Configuration Encryption
  CONFIG_ENCRYPTION_KEY: {
    required: true,
    example: "4f21ccb3d2b2b0ad50f08c0426b0c16f08bfa1b0ace489b8f7547e6245c2f456",
    description: "Key for encrypting sensitive configuration in database",
    generate: "openssl rand -hex 32",
    sensitive: true
  },

  // Redis Configuration
  REDIS_HOST: {
    required: true,
    example: "localhost",
    description: "Redis server hostname",
    production: "Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)"
  },
  REDIS_PORT: {
    required: true,
    example: "6379",
    description: "Redis server port"
  },
  REDIS_PASSWORD: {
    required: false,
    example: "",
    description: "Redis authentication password (empty for local)",
    production: "Always set a password in production"
  }
};

/**
 * Generate .env template file content with actual values from current .env
 */
function generateEnvTemplate() {
  let content = `# ===============================================
# Content Hub - Environment Variables
# ===============================================
# Generated: ${new Date().toISOString()}
# Use this template to create your .env file
# ===============================================

# Database
# For local PostgreSQL, update with your credentials
DATABASE_URL="postgresql://postgres:password@localhost:5432/content_hub?schema=public"

# AWS S3 Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key_here"
AWS_SECRET_ACCESS_KEY="your_secret_key_here"
AWS_S3_BUCKET="content-hub-assets"

# NextAuth Secret (for authentication)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Configuration Encryption
CONFIG_ENCRYPTION_KEY="4f21ccb3d2b2b0ad50f08c0426b0c16f08bfa1b0ace489b8f7547e6245c2f456"

# Redis Configuration (for email queues)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""`;

  return content;
}

/**
 * Production-ready .env template with actual working values
 */
function generateProductionTemplate() {
  let content = `# ===============================================
# Content Hub - Production Environment Variables
# ===============================================
# Generated: ${new Date().toISOString()}
# IMPORTANT: Update the database URL and domain for your production environment
# AWS credentials need to be updated with your actual AWS account details
# ===============================================

# Database - Update with your production database URL
DATABASE_URL="postgresql://db_user:db_password@your-db-host.amazonaws.com:5432/content_hub?schema=public"

# AWS S3 Configuration - These need to be updated with your AWS credentials
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key_here"
AWS_SECRET_ACCESS_KEY="your_secret_key_here"
AWS_S3_BUCKET="content-hub-assets"

# NextAuth Secret - Using exact value from .env
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"

# Application - Update with your actual domain
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Configuration Encryption - Using the actual key from current config
CONFIG_ENCRYPTION_KEY="4f21ccb3d2b2b0ad50f08c0426b0c16f08bfa1b0ace489b8f7547e6245c2f456"

# Redis Configuration - Update with your Redis instance details
REDIS_HOST="your-redis-endpoint.cache.amazonaws.com"
REDIS_PORT="6379"
REDIS_PASSWORD="your-redis-password"`;

  return content;
}

/**
 * Validate current environment variables
 */
function validateEnv() {
  const missing = [];
  const warnings = [];

  for (const [key, config] of Object.entries(ENV_VARIABLES)) {
    const value = process.env[key];

    if (config.required && !value) {
      missing.push(key);
    }

    // Check for placeholder values
    if (value && value.includes('your_') && value.includes('_here')) {
      warnings.push(`${key} is still using placeholder value`);
    }

    // Check for localhost in production
    if (process.env.NODE_ENV === 'production') {
      if ((key === 'NEXTAUTH_URL' || key === 'NEXT_PUBLIC_APP_URL') && value?.includes('localhost')) {
        warnings.push(`${key} is still pointing to localhost`);
      }
    }
  }

  return { missing, warnings };
}

/**
 * Instructions for deployment
 */
const DEPLOYMENT_INSTRUCTIONS = `
===============================================
DEPLOYMENT INSTRUCTIONS FOR CONTENT HUB
===============================================

1. DATABASE SETUP:
   - Create a PostgreSQL database (v14+)
   - Update DATABASE_URL with your connection string
   - Run migrations: npx prisma migrate deploy
   - Seed initial data (optional): npm run seed

2. AWS S3 SETUP:
   - Create an S3 bucket in your preferred region
   - Enable versioning and encryption
   - Configure CORS policy for your domain
   - Create IAM user with S3 full access to the bucket
   - Replace "your_access_key_here" with actual AWS Access Key ID
   - Replace "your_secret_key_here" with actual AWS Secret Access Key
   - Update AWS_S3_BUCKET with your bucket name

3. REDIS SETUP:
   - Install Redis locally OR
   - Use managed service (AWS ElastiCache, Redis Cloud)
   - Update REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
   - Ensure Redis persistence is enabled for production

4. SECURITY KEYS (Exact values from .env):
   - NEXTAUTH_SECRET: "your-secret-key-here"
   - CONFIG_ENCRYPTION_KEY: "4f21ccb3d2b2b0ad50f08c0426b0c16f08bfa1b0ace489b8f7547e6245c2f456"

   To generate new secrets for production:
   - NEXTAUTH_SECRET: openssl rand -base64 32
   - CONFIG_ENCRYPTION_KEY: openssl rand -hex 32

5. UPDATE URLs:
   - Change NEXTAUTH_URL from "http://localhost:3000" to your production domain
   - Change NEXT_PUBLIC_APP_URL from "http://localhost:3000" to your production domain
   - Both should use HTTPS in production

6. VERIFY BEFORE DEPLOYMENT:
   - Run: node env.js validate
   - Test database connection: npx prisma db pull
   - Test S3 access: npm run test:s3
   - Test Redis connection: npm run check:redis

7. DEPLOYMENT COMMANDS:
   npm install --production
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   npm start

8. CURRENT CONFIGURATION STATUS:
   - Database: postgresql://postgres:password@localhost:5432/content_hub
   - AWS Region: us-east-1
   - AWS Bucket: content-hub-assets
   - Redis: localhost:6379 (no password)
   - App URL: http://localhost:3000
`;

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ENV_VARIABLES,
    generateEnvTemplate,
    generateProductionTemplate,
    validateEnv,
    DEPLOYMENT_INSTRUCTIONS
  };
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'generate') {
    console.log(generateEnvTemplate());
  } else if (command === 'production') {
    console.log(generateProductionTemplate());
  } else if (command === 'validate') {
    const { missing, warnings } = validateEnv();

    if (missing.length > 0) {
      console.error("❌ Missing required environment variables:");
      missing.forEach(v => console.error(`   - ${v}`));
    }

    if (warnings.length > 0) {
      console.warn("⚠️  Warnings:");
      warnings.forEach(w => console.warn(`   - ${w}`));
    }

    if (missing.length === 0 && warnings.length === 0) {
      console.log("✅ All environment variables are configured!");
    }

    process.exit(missing.length > 0 ? 1 : 0);
  } else if (command === 'deploy') {
    console.log(DEPLOYMENT_INSTRUCTIONS);
  } else {
    console.log(`
Content Hub - Environment Configuration Helper

Usage:
  node env.js generate    - Generate local development .env template
  node env.js production  - Generate production .env template
  node env.js validate    - Validate current environment
  node env.js deploy      - Show deployment instructions

Current variables required: ${Object.keys(ENV_VARIABLES).length}
    `);
  }
}