// Unified Admin Configuration Types
// This file defines the centralized configuration structure for the admin dashboard

export interface UnifiedAdminConfig {
  general: GeneralConfig
  limits: LimitsConfig
  security: SecurityConfig
  services: ServicesConfig
  backup: BackupConfig
}

// General site configuration
export interface GeneralConfig {
  siteName: string
  siteDescription?: string
  maintenanceMode: boolean
  allowRegistration: boolean
}

// Centralized limits and quotas
export interface LimitsConfig {
  storage: {
    maxFileSize: number // in MB
    maxStoragePerUser: number // in GB
    allowedFileTypes: string[]
    maxFilesPerUpload: number
  }
  api: {
    rateLimit: number // requests per hour
    timeout: number // in milliseconds
    maxRequestSize: number // in MB
  }
  email: {
    dailyLimit: number
    ratePerSecond: number
    maxRecipients: number
    maxAttachmentSize: number // in MB
  }
}

// Security and authentication settings
export interface SecurityConfig {
  authentication: {
    enableTwoFactor: boolean
    sessionTimeout: number // in minutes
    maxLoginAttempts: number
    lockoutDuration: number // in minutes
  }
  password: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSymbols: boolean
    expiryDays: number
    preventReuse: number // number of previous passwords to check
  }
  credentials: {
    aws: {
      s3?: AWSCredentials
      ses?: AWSCredentials
    }
    smtp?: SMTPCredentials
    sendgrid?: { apiKey: string }
    mailgun?: { apiKey: string; domain: string }
    apiKeys: APIKey[]
  }
}

// Service-specific configurations
export interface ServicesConfig {
  storage: StorageServiceConfig
  email: EmailServiceConfig
  cdn?: CDNConfig
}

// Storage service configuration (inherits from limits)
export interface StorageServiceConfig {
  enabled: boolean
  provider: 'local' | 's3' | 'azure' | 'gcp'
  s3?: {
    bucket: string
    region: string
    serverSideEncryption: 'AES256' | 'aws:kms'
    storageClass: string
    versioning: boolean
    lifecycleRules?: S3LifecycleRule[]
  }
  local?: {
    path: string
    publicUrl: string
  }
  // Inherits maxFileSize and allowedFileTypes from limits.storage
}

// Email service configuration
export interface EmailServiceConfig {
  enabled: boolean
  provider: 'ses' | 'smtp' | 'sendgrid' | 'mailgun'
  fromEmail: string
  fromName: string
  replyToEmail?: string
  sandboxMode: boolean
  templates: EmailTemplate[]
  notifications: {
    systemAlerts: boolean
    userActivity: boolean
    security: boolean
  }
  // Inherits dailyLimit and ratePerSecond from limits.email
}

// Backup configuration
export interface BackupConfig {
  autoBackup: boolean
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
  retentionDays: number
  includeUserData: boolean
  includeAssets: boolean
  backupLocation: 'local' | 's3' | 'external'
  notifications: {
    onSuccess: boolean
    onFailure: boolean
    email?: string
  }
}

// Supporting types
export interface AWSCredentials {
  accessKeyId: string
  secretAccessKey: string
  region: string
  encrypted?: boolean
}

export interface SMTPCredentials {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  encrypted?: boolean
}

export interface APIKey {
  id: string
  name: string
  key: string
  permissions: string[]
  expiresAt?: Date
  createdAt: Date
  lastUsedAt?: Date
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody?: string
  variables: string[]
  category: string
}

export interface S3LifecycleRule {
  id: string
  status: 'Enabled' | 'Disabled'
  transitions: {
    days: number
    storageClass: string
  }[]
  expiration?: {
    days: number
  }
}

export interface CDNConfig {
  enabled: boolean
  provider: 'cloudfront' | 'cloudflare' | 'fastly'
  domain: string
  settings: Record<string, any>
}

// Configuration validation types
export interface ConfigValidationResult {
  valid: boolean
  errors: ConfigValidationError[]
  warnings: ConfigValidationWarning[]
}

export interface ConfigValidationError {
  field: string
  message: string
  severity: 'error'
}

export interface ConfigValidationWarning {
  field: string
  message: string
  severity: 'warning'
}

// Configuration change audit
export interface ConfigAuditEntry {
  id: string
  timestamp: Date
  userId: string
  userEmail: string
  section: string
  field: string
  oldValue: any
  newValue: any
  ipAddress?: string
  userAgent?: string
}