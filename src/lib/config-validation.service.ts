import { 
  UnifiedAdminConfig, 
  ConfigValidationResult, 
  ConfigValidationError, 
  ConfigValidationWarning 
} from '@/types/admin-config'

export class ConfigValidationService {
  private errors: ConfigValidationError[] = []
  private warnings: ConfigValidationWarning[] = []

  /**
   * Validates the entire configuration
   */
  validateConfiguration(config: Partial<UnifiedAdminConfig>): ConfigValidationResult {
    this.errors = []
    this.warnings = []

    // Validate each section
    if (config.general) this.validateGeneral(config.general)
    if (config.limits) this.validateLimits(config.limits)
    if (config.security) this.validateSecurity(config.security)
    if (config.services) this.validateServices(config.services)
    if (config.backup) this.validateBackup(config.backup)

    // Check cross-section dependencies
    this.validateCrossDependencies(config)

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }

  private validateGeneral(general: UnifiedAdminConfig['general']) {
    if (!general.siteName || general.siteName.trim().length === 0) {
      this.addError('general.siteName', 'Site name is required')
    }

    if (general.siteName && general.siteName.length > 100) {
      this.addError('general.siteName', 'Site name must be less than 100 characters')
    }

    if (general.maintenanceMode && general.allowRegistration) {
      this.addWarning('general', 'Registration is enabled while site is in maintenance mode')
    }
  }

  private validateLimits(limits: UnifiedAdminConfig['limits']) {
    // Storage limits
    if (limits.storage.maxFileSize <= 0) {
      this.addError('limits.storage.maxFileSize', 'Max file size must be greater than 0')
    }

    if (limits.storage.maxFileSize > 5000) {
      this.addWarning('limits.storage.maxFileSize', 'Max file size over 5GB may cause upload issues')
    }

    if (limits.storage.maxStoragePerUser <= 0) {
      this.addError('limits.storage.maxStoragePerUser', 'Max storage per user must be greater than 0')
    }

    if (!limits.storage.allowedFileTypes || limits.storage.allowedFileTypes.length === 0) {
      this.addError('limits.storage.allowedFileTypes', 'At least one file type must be allowed')
    }

    // API limits
    if (limits.api.rateLimit <= 0) {
      this.addError('limits.api.rateLimit', 'API rate limit must be greater than 0')
    }

    if (limits.api.timeout < 1000) {
      this.addError('limits.api.timeout', 'API timeout must be at least 1000ms')
    }

    if (limits.api.timeout > 300000) {
      this.addWarning('limits.api.timeout', 'API timeout over 5 minutes may cause connection issues')
    }

    // Email limits
    if (limits.email.dailyLimit <= 0) {
      this.addError('limits.email.dailyLimit', 'Daily email limit must be greater than 0')
    }

    if (limits.email.ratePerSecond <= 0) {
      this.addError('limits.email.ratePerSecond', 'Email rate per second must be greater than 0')
    }

    if (limits.email.ratePerSecond > 100) {
      this.addWarning('limits.email.ratePerSecond', 'Email rate over 100/sec may trigger spam filters')
    }
  }

  private validateSecurity(security: UnifiedAdminConfig['security']) {
    // Authentication
    if (security.authentication.sessionTimeout < 5) {
      this.addError('security.authentication.sessionTimeout', 'Session timeout must be at least 5 minutes')
    }

    if (security.authentication.sessionTimeout > 1440) {
      this.addWarning('security.authentication.sessionTimeout', 'Session timeout over 24 hours may be a security risk')
    }

    if (security.authentication.maxLoginAttempts < 3) {
      this.addError('security.authentication.maxLoginAttempts', 'Max login attempts must be at least 3')
    }

    // Password policy
    if (security.password.minLength < 6) {
      this.addError('security.password.minLength', 'Password minimum length must be at least 6')
    }

    if (security.password.minLength < 8) {
      this.addWarning('security.password.minLength', 'Consider using a minimum password length of 8 or more')
    }

    if (!security.password.requireUppercase && 
        !security.password.requireLowercase && 
        !security.password.requireNumbers && 
        !security.password.requireSymbols) {
      this.addWarning('security.password', 'No password complexity requirements are enabled')
    }

    // Credentials validation
    if (security.credentials.aws?.s3) {
      this.validateAWSCredentials(security.credentials.aws.s3, 's3')
    }

    if (security.credentials.aws?.ses) {
      this.validateAWSCredentials(security.credentials.aws.ses, 'ses')
    }

    if (security.credentials.smtp) {
      this.validateSMTPCredentials(security.credentials.smtp)
    }
  }

  private validateAWSCredentials(creds: any, service: string) {
    if (!creds.accessKeyId || !creds.accessKeyId.startsWith('AKIA')) {
      this.addError(`security.credentials.aws.${service}.accessKeyId`, 'Invalid AWS Access Key ID format')
    }

    if (!creds.secretAccessKey || creds.secretAccessKey.length < 20) {
      this.addError(`security.credentials.aws.${service}.secretAccessKey`, 'Invalid AWS Secret Access Key')
    }

    if (!creds.region) {
      this.addError(`security.credentials.aws.${service}.region`, 'AWS region is required')
    }

    if (!creds.encrypted) {
      this.addWarning(`security.credentials.aws.${service}`, 'Consider encrypting AWS credentials')
    }
  }

  private validateSMTPCredentials(smtp: any) {
    if (!smtp.host) {
      this.addError('security.credentials.smtp.host', 'SMTP host is required')
    }

    if (smtp.port <= 0 || smtp.port > 65535) {
      this.addError('security.credentials.smtp.port', 'Invalid SMTP port')
    }

    if (!smtp.username || !smtp.password) {
      this.addError('security.credentials.smtp', 'SMTP username and password are required')
    }

    if (!smtp.secure && smtp.port !== 587) {
      this.addWarning('security.credentials.smtp', 'Consider using TLS/SSL for SMTP connections')
    }
  }

  private validateServices(
    services: UnifiedAdminConfig['services']
  ) {
    // Storage service
    if (services.storage.enabled && services.storage.provider === 's3') {
      if (!services.storage.s3?.bucket) {
        this.addError('services.storage.s3.bucket', 'S3 bucket name is required')
      }

      if (!services.storage.s3?.region) {
        this.addError('services.storage.s3.region', 'S3 region is required')
      }

      if (services.storage.s3?.versioning && !services.storage.s3?.lifecycleRules) {
        this.addWarning('services.storage.s3', 'Consider adding lifecycle rules with versioning enabled')
      }
    }

    // Email service
    if (services.email.enabled) {
      if (!services.email.fromEmail) {
        this.addError('services.email.fromEmail', 'From email address is required')
      }

      if (!this.isValidEmail(services.email.fromEmail)) {
        this.addError('services.email.fromEmail', 'Invalid from email address')
      }

      if (services.email.replyToEmail && !this.isValidEmail(services.email.replyToEmail)) {
        this.addError('services.email.replyToEmail', 'Invalid reply-to email address')
      }

      if (services.email.sandboxMode) {
        this.addWarning('services.email', 'Email service is in sandbox mode - emails will not be sent')
      }
    }
  }

  private validateBackup(backup: UnifiedAdminConfig['backup']) {
    if (backup.autoBackup) {
      if (backup.retentionDays < 1) {
        this.addError('backup.retentionDays', 'Retention period must be at least 1 day')
      }

      if (backup.retentionDays > 365) {
        this.addWarning('backup.retentionDays', 'Long retention periods may use excessive storage')
      }

      if (!backup.includeUserData && !backup.includeAssets) {
        this.addWarning('backup', 'No data selected for backup')
      }

      if (backup.notifications.onSuccess || backup.notifications.onFailure) {
        if (!backup.notifications.email || !this.isValidEmail(backup.notifications.email)) {
          this.addError('backup.notifications.email', 'Valid email required for backup notifications')
        }
      }
    }
  }

  private validateCrossDependencies(config: Partial<UnifiedAdminConfig>) {
    // Check if email notifications are enabled but email service is not configured
    if (config.services?.email && config.backup?.notifications) {
      if (!config.services.email.enabled && 
          (config.backup.notifications.onSuccess || config.backup.notifications.onFailure)) {
        this.addWarning('backup.notifications', 'Email notifications enabled but email service is not configured')
      }
    }

    // Check if S3 storage is enabled but credentials are missing
    if (config.services?.storage?.enabled && 
        config.services.storage.provider === 's3' && 
        !config.security?.credentials?.aws?.s3) {
      this.addError('services.storage', 'S3 storage enabled but AWS credentials not configured')
    }

    // Check if SES email is enabled but credentials are missing
    if (config.services?.email?.enabled && 
        config.services.email.provider === 'ses' && 
        !config.security?.credentials?.aws?.ses) {
      this.addError('services.email', 'AWS SES enabled but AWS credentials not configured')
    }

    // Check if SMTP email is enabled but credentials are missing
    if (config.services?.email?.enabled && 
        config.services.email.provider === 'smtp' && 
        !config.security?.credentials?.smtp) {
      this.addError('services.email', 'SMTP enabled but SMTP credentials not configured')
    }

    // Check file size consistency
    if (config.limits?.storage && config.limits?.email) {
      if (config.limits.email.maxAttachmentSize > config.limits.storage.maxFileSize) {
        this.addWarning('limits', 'Email attachment size exceeds max file upload size')
      }
    }

    // Check if maintenance mode conflicts
    if (config.general?.maintenanceMode) {
      if (config.services?.email?.notifications?.userActivity) {
        this.addWarning('services.email.notifications', 'User activity notifications enabled during maintenance mode')
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private addError(field: string, message: string) {
    this.errors.push({ field, message, severity: 'error' })
  }

  private addWarning(field: string, message: string) {
    this.warnings.push({ field, message, severity: 'warning' })
  }

  /**
   * Validates a single field
   */
  validateField(field: string, value: any): ConfigValidationResult {
    this.errors = []
    this.warnings = []

    // Add field-specific validation logic here
    const fieldParts = field.split('.')
    
    switch (fieldParts[0]) {
      case 'general':
        if (fieldParts[1] === 'siteName' && (!value || value.trim().length === 0)) {
          this.addError(field, 'Site name is required')
        }
        break
      case 'limits':
        if (fieldParts[2] === 'maxFileSize' && value <= 0) {
          this.addError(field, 'Must be greater than 0')
        }
        break
      case 'security':
        if (fieldParts[2] === 'sessionTimeout' && value < 5) {
          this.addError(field, 'Must be at least 5 minutes')
        }
        break
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    }
  }
}

// Export singleton instance
export const configValidator = new ConfigValidationService()