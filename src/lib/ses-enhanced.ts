import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  ListTemplatesCommand,
  VerifyEmailIdentityCommand,
  VerifyDomainIdentityCommand,
  GetSendQuotaCommand,
  GetSendStatisticsCommand,
  ListVerifiedEmailAddressesCommand,
} from '@aws-sdk/client-ses'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import nodemailer from 'nodemailer'
import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

// Email configuration interface
export interface SESConfig {
  enabled: boolean
  provider: 'ses' | 'smtp' | 'sendgrid' | 'mailgun'
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  fromEmail?: string
  fromName?: string
  replyToEmail?: string
  
  // SMTP settings (fallback)
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  
  // Advanced settings
  maxRetries?: number
  retryDelay?: number
  dailyLimit?: number
  rateLimit?: number // emails per second
  sandboxMode?: boolean
  configurationSet?: string
}

// Email metrics
export interface EmailMetrics {
  sent: number
  failed: number
  bounced: number
  complaints: number
  delivered: number
  opened: number
  clicked: number
  queued: number
  lastError?: string
  lastSentAt?: Date
}

// Email template
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody?: string
  variables?: string[]
  createdAt: Date
  updatedAt: Date
}

// Email job data
export interface EmailJob {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  templateId?: string
  templateData?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  tags?: Record<string, string>
  priority?: number
  scheduledFor?: Date
}

class SESService {
  private client: SESClient | null = null
  private smtpTransporter: any = null
  private config: SESConfig
  private metrics: EmailMetrics = {
    sent: 0,
    failed: 0,
    bounced: 0,
    complaints: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    queued: 0,
  }
  private emailQueue: Queue | null = null
  private emailWorker: Worker | null = null
  private redis: Redis | null = null
  private isConfigured = false

  constructor() {
    // Load initial config from environment
    this.config = this.loadConfig()
    // Initialize with database config if available
    this.initializeFromDatabase()
    this.initializeQueue()
  }

  private async initializeFromDatabase() {
    try {
      // Import dynamically to avoid circular dependencies
      const { ConfigurationService } = await import('./config-service')
      const dbConfig = await ConfigurationService.getSESConfig()
      
      if (dbConfig) {
        // Override with database configuration
        this.config = { ...this.config, ...dbConfig }
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
          console.log('📧 Loaded SES configuration from database')
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load SES config from database, using environment variables:', error)
    }
    
    // Initialize the client with the loaded configuration
    this.initializeClient()
  }

  private loadConfig(): SESConfig {
    return {
      enabled: process.env.EMAIL_ENABLED === 'true',
      provider: (process.env.EMAIL_PROVIDER as 'ses' | 'smtp') || 'smtp',
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Content Hub',
      replyToEmail: process.env.EMAIL_REPLY_TO,
      
      // SMTP settings
      smtpHost: process.env.SMTP_HOST || 'localhost',
      smtpPort: parseInt(process.env.SMTP_PORT || '587'),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER,
      smtpPassword: process.env.SMTP_PASSWORD,
      
      // Advanced settings
      maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.EMAIL_RETRY_DELAY || '60000'),
      dailyLimit: parseInt(process.env.EMAIL_DAILY_LIMIT || '10000'),
      rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT || '10'),
      sandboxMode: process.env.EMAIL_SANDBOX_MODE === 'true',
      configurationSet: process.env.SES_CONFIGURATION_SET,
    }
  }

  private initializeClient() {
    // Initialize SES client if using AWS SES
    if (
      this.config.enabled &&
      this.config.provider === 'ses' &&
      this.config.accessKeyId &&
      this.config.accessKeyId !== 'your_access_key_here' &&
      this.config.secretAccessKey &&
      this.config.secretAccessKey !== 'your_secret_key_here'
    ) {
      try {
        this.client = new SESClient({
          region: this.config.region,
          credentials: {
            accessKeyId: this.config.accessKeyId,
            secretAccessKey: this.config.secretAccessKey,
          },
          maxAttempts: this.config.maxRetries,
          retryMode: 'adaptive',
          requestHandler: new NodeHttpHandler({
            connectionTimeout: 5000,
            requestTimeout: 30000,
          }),
        })
        this.isConfigured = true
        console.log('✅ SES client initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize SES client:', error)
        this.client = null
        this.isConfigured = false
      }
    }

    // Initialize SMTP transporter as fallback or primary
    if (
      this.config.enabled &&
      (this.config.provider === 'smtp' || !this.client) &&
      this.config.smtpHost
    ) {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: this.config.smtpHost,
          port: this.config.smtpPort,
          secure: this.config.smtpSecure,
          auth: this.config.smtpUser ? {
            user: this.config.smtpUser,
            pass: this.config.smtpPassword,
          } : undefined,
        })
        
        if (!this.isConfigured) {
          this.isConfigured = true
          console.log('✅ SMTP transporter initialized successfully')
        }
      } catch (error) {
        console.error('❌ Failed to initialize SMTP transporter:', error)
        this.smtpTransporter = null
      }
    }

    if (!this.isConfigured && process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
      console.warn('⚠️ Email service not configured - emails will be logged only')
    }
  }

  private async initializeQueue() {
    try {
      // Only initialize queue if Redis is available
      const hasRedis = process.env.REDIS_HOST || process.env.REDIS_URL
      
      if (hasRedis) {
        // Create Redis connection
        if (process.env.REDIS_URL) {
          this.redis = new Redis(process.env.REDIS_URL)
        } else {
          this.redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryStrategy: (times: number) => {
              if (times > 3) {
                console.error('❌ Failed to connect to Redis after 3 attempts')
                return null
              }
              return Math.min(times * 100, 3000)
            }
          })
        }
        
        // Create email queue
        this.emailQueue = new Queue('emails', {
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
          },
          defaultJobOptions: {
            attempts: this.config.maxRetries,
            backoff: {
              type: 'exponential',
              delay: this.config.retryDelay,
            },
            removeOnComplete: {
              count: 100,
            },
            removeOnFail: {
              count: 50,
            },
          },
        })

        // Create email worker
        this.emailWorker = new Worker(
          'emails',
          async (job: Job<EmailJob>) => {
            await this.processEmailJob(job.data)
          },
          {
            connection: {
              host: process.env.REDIS_HOST || 'localhost',
              port: parseInt(process.env.REDIS_PORT || '6379'),
              password: process.env.REDIS_PASSWORD,
              db: parseInt(process.env.REDIS_DB || '0'),
            },
            concurrency: this.config.rateLimit,
          }
        )

        this.emailWorker.on('completed', () => {
          this.metrics.delivered++
        })

        this.emailWorker.on('failed', (job, err) => {
          this.metrics.failed++
          this.metrics.lastError = err.message
          console.error(`Email job ${job?.id} failed:`, err)
        })

        // Only log in development and not during build
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
          console.log('✅ Email queue initialized successfully')
        }
      } else {
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PHASE) {
          console.log('⚠️ Redis not configured - email queue disabled')
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize email queue:', error)
    }
  }

  // Get current configuration and status
  public getStatus(): { config: SESConfig; metrics: EmailMetrics; isConfigured: boolean } {
    return {
      config: { ...this.config },
      metrics: { ...this.metrics },
      isConfigured: this.isConfigured,
    }
  }

  // Update configuration and save to database
  public async updateConfig(newConfig: Partial<SESConfig>, userId?: string): Promise<void> {
    this.config = { ...this.config, ...newConfig }
    
    // Save to database
    try {
      const { ConfigurationService } = await import('./config-service')
      await ConfigurationService.saveSESConfig(this.config, userId, 'Updated via admin dashboard')
      console.log('✅ SES configuration saved to database')
    } catch (error) {
      console.error('❌ Failed to save SES config to database:', error)
    }
    
    // Reinitialize client with new config
    this.initializeClient()
    
    // Update environment variables for backward compatibility
    process.env.EMAIL_ENABLED = String(this.config.enabled)
    process.env.EMAIL_PROVIDER = this.config.provider
    process.env.AWS_REGION = this.config.region
    if (this.config.accessKeyId) process.env.AWS_ACCESS_KEY_ID = this.config.accessKeyId
    if (this.config.secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = this.config.secretAccessKey
    if (this.config.fromEmail) process.env.EMAIL_FROM = this.config.fromEmail
    if (this.config.fromName) process.env.EMAIL_FROM_NAME = this.config.fromName
    if (this.config.smtpHost) process.env.SMTP_HOST = this.config.smtpHost
    if (this.config.smtpPort) process.env.SMTP_PORT = String(this.config.smtpPort)
    if (this.config.smtpUser) process.env.SMTP_USER = this.config.smtpUser
    if (this.config.smtpPassword) process.env.SMTP_PASSWORD = this.config.smtpPassword
  }

  // Test email configuration
  public async testConnection(): Promise<{ success: boolean; error?: string; info?: any }> {
    try {
      if (this.client && this.config.provider === 'ses') {
        // Test SES connection
        const quotaResponse = await this.client.send(new GetSendQuotaCommand({}))
        const verifiedEmails = await this.client.send(new ListVerifiedEmailAddressesCommand({}))
        
        return {
          success: true,
          info: {
            provider: 'AWS SES',
            quota: {
              max24HourSend: quotaResponse.Max24HourSend,
              sentLast24Hours: quotaResponse.SentLast24Hours,
              maxSendRate: quotaResponse.MaxSendRate,
            },
            verifiedEmails: verifiedEmails.VerifiedEmailAddresses,
          },
        }
      } else if (this.smtpTransporter) {
        // Test SMTP connection
        await this.smtpTransporter.verify()
        
        return {
          success: true,
          info: {
            provider: 'SMTP',
            host: this.config.smtpHost,
            port: this.config.smtpPort,
            secure: this.config.smtpSecure,
          },
        }
      } else {
        return {
          success: false,
          error: 'No email service configured',
        }
      }
    } catch (error: any) {
      this.metrics.lastError = error.message
      return {
        success: false,
        error: error.message || 'Failed to test email connection',
      }
    }
  }

  // Send email immediately
  public async sendEmail(data: EmailJob): Promise<void> {
    if (this.config.sandboxMode) {
      console.log('📧 [SANDBOX MODE] Would send email:', data)
      this.metrics.sent++
      return
    }

    if (!this.isConfigured) {
      console.log('📧 [NOT CONFIGURED] Would send email:', data)
      throw new Error('Email service not configured')
    }

    try {
      if (this.client && this.config.provider === 'ses') {
        await this.sendViaSES(data)
      } else if (this.smtpTransporter) {
        await this.sendViaSMTP(data)
      } else {
        throw new Error('No email service available')
      }

      this.metrics.sent++
      this.metrics.lastSentAt = new Date()
      
      // Log email to database
      await this.logEmail(data, 'sent')
    } catch (error: any) {
      this.metrics.failed++
      this.metrics.lastError = error.message
      
      // Log failed email
      await this.logEmail(data, 'failed', error.message)
      
      throw error
    }
  }

  // Queue email for background processing
  public async queueEmail(data: EmailJob): Promise<string> {
    if (this.emailQueue) {
      const job = await this.emailQueue.add('send-email', data, {
        priority: data.priority || 0,
        delay: data.scheduledFor ? new Date(data.scheduledFor).getTime() - Date.now() : 0,
      })
      
      this.metrics.queued++
      return job.id as string
    } else {
      // If no queue, send immediately
      await this.sendEmail(data)
      return 'immediate'
    }
  }

  // Process email job from queue
  private async processEmailJob(data: EmailJob): Promise<void> {
    await this.sendEmail(data)
  }

  // Send via AWS SES
  private async sendViaSES(data: EmailJob): Promise<void> {
    if (!this.client) throw new Error('SES client not initialized')

    const toAddresses = Array.isArray(data.to) ? data.to : [data.to]
    
    if (data.templateId && data.templateData) {
      // Send templated email
      const command = new SendTemplatedEmailCommand({
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: toAddresses,
        },
        Template: data.templateId,
        TemplateData: JSON.stringify(data.templateData),
        ReplyToAddresses: this.config.replyToEmail ? [this.config.replyToEmail] : undefined,
        ConfigurationSetName: this.config.configurationSet,
        Tags: data.tags ? Object.entries(data.tags).map(([Name, Value]) => ({ Name, Value })) : undefined,
      })
      
      await this.client.send(command)
    } else {
      // Send regular email
      const command = new SendEmailCommand({
        Source: `${this.config.fromName} <${this.config.fromEmail}>`,
        Destination: {
          ToAddresses: toAddresses,
        },
        Message: {
          Subject: {
            Data: data.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: data.html ? {
              Data: data.html,
              Charset: 'UTF-8',
            } : undefined,
            Text: data.text ? {
              Data: data.text,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
        ReplyToAddresses: this.config.replyToEmail ? [this.config.replyToEmail] : undefined,
        ConfigurationSetName: this.config.configurationSet,
        Tags: data.tags ? Object.entries(data.tags).map(([Name, Value]) => ({ Name, Value })) : undefined,
      })
      
      await this.client.send(command)
    }
  }

  // Send via SMTP
  private async sendViaSMTP(data: EmailJob): Promise<void> {
    if (!this.smtpTransporter) throw new Error('SMTP transporter not initialized')

    await this.smtpTransporter.sendMail({
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: Array.isArray(data.to) ? data.to.join(', ') : data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
      replyTo: this.config.replyToEmail,
      attachments: data.attachments,
    })
  }

  // Verify email address
  public async verifyEmailAddress(email: string): Promise<void> {
    if (!this.client || this.config.provider !== 'ses') {
      throw new Error('Email verification only available with SES')
    }

    await this.client.send(new VerifyEmailIdentityCommand({
      EmailAddress: email,
    }))
  }

  // Verify domain
  public async verifyDomain(domain: string): Promise<{ verificationToken: string }> {
    if (!this.client || this.config.provider !== 'ses') {
      throw new Error('Domain verification only available with SES')
    }

    const response = await this.client.send(new VerifyDomainIdentityCommand({
      Domain: domain,
    }))

    return {
      verificationToken: response.VerificationToken!,
    }
  }

  // Get SES statistics
  public async getStatistics(): Promise<any> {
    if (!this.client || this.config.provider !== 'ses') {
      return this.metrics
    }

    try {
      const [quota, stats] = await Promise.all([
        this.client.send(new GetSendQuotaCommand({})),
        this.client.send(new GetSendStatisticsCommand({})),
      ])

      return {
        ...this.metrics,
        quota: {
          max24HourSend: quota.Max24HourSend,
          sentLast24Hours: quota.SentLast24Hours,
          maxSendRate: quota.MaxSendRate,
        },
        statistics: stats.SendDataPoints,
      }
    } catch {
      return this.metrics
    }
  }

  // Template management
  public async createTemplate(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    if (!this.client || this.config.provider !== 'ses') {
      throw new Error('Template management only available with SES')
    }

    await this.client.send(new CreateTemplateCommand({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        HtmlPart: template.htmlBody,
        TextPart: template.textBody,
      },
    }))
  }

  public async updateTemplate(template: EmailTemplate): Promise<void> {
    if (!this.client || this.config.provider !== 'ses') {
      throw new Error('Template management only available with SES')
    }

    await this.client.send(new UpdateTemplateCommand({
      Template: {
        TemplateName: template.name,
        SubjectPart: template.subject,
        HtmlPart: template.htmlBody,
        TextPart: template.textBody,
      },
    }))
  }

  public async deleteTemplate(name: string): Promise<void> {
    if (!this.client || this.config.provider !== 'ses') {
      throw new Error('Template management only available with SES')
    }

    await this.client.send(new DeleteTemplateCommand({
      TemplateName: name,
    }))
  }

  public async listTemplates(): Promise<string[]> {
    if (!this.client || this.config.provider !== 'ses') {
      return []
    }

    const response = await this.client.send(new ListTemplatesCommand({
      MaxItems: 100,
    }))

    return response.TemplatesMetadata?.map(t => t.Name!) || []
  }

  // Log email to database
  private async logEmail(data: EmailJob, status: string, error?: string): Promise<void> {
    try {
      // This would normally save to a database
      // For now, just log to console
      console.log(`📧 Email ${status}:`, {
        to: data.to,
        subject: data.subject,
        status,
        error,
        timestamp: new Date(),
      })
    } catch (err) {
      console.error('Failed to log email:', err)
    }
  }

  // Get queue status
  public async getQueueStatus(): Promise<any> {
    if (!this.emailQueue) {
      return { enabled: false }
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
    ])

    return {
      enabled: true,
      waiting,
      active,
      completed,
      failed,
    }
  }

  // Clear queue
  public async clearQueue(): Promise<void> {
    if (this.emailQueue) {
      await this.emailQueue.obliterate({ force: true })
      this.metrics.queued = 0
    }
  }

  // Cleanup resources
  public async cleanup(): Promise<void> {
    if (this.emailWorker) {
      await this.emailWorker.close()
    }
    if (this.emailQueue) {
      await this.emailQueue.close()
    }
    if (this.redis) {
      this.redis.disconnect()
    }
  }
}

// Export singleton instance
export const sesService = new SESService()

// Export convenience functions for backward compatibility
export const sendEmail = (data: EmailJob) => sesService.sendEmail(data)
export const queueEmail = (data: EmailJob) => sesService.queueEmail(data)
export const verifyEmailAddress = (email: string) => sesService.verifyEmailAddress(email)
export const getEmailStatistics = () => sesService.getStatistics()