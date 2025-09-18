import { NotificationType } from '@prisma/client'
import { sesService, queueEmail } from './ses-enhanced'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface NotificationEmailData {
  userId: string
  userEmail: string
  userName?: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  metadata?: any
}

class EmailService {
  /**
   * Initialize the email service
   * This is now handled by the enhanced SES service
   */
  static async initialize() {
    // Service is automatically initialized in ses-enhanced.ts
    const status = sesService.getStatus()
    if (status.isConfigured) {
      console.log('Email service initialized successfully')
    } else {
      console.warn('Email service not configured. Email notifications will be disabled.')
    }
  }

  /**
   * Send an email
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Queue the email for background processing
      await queueEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        tags: {
          source: 'content-hub',
          type: 'transactional'
        }
      })
      
      console.log('Email queued successfully:', options.to)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      
      // Try to send immediately if queueing fails
      try {
        await sesService.sendEmail({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
        return true
      } catch (immediateError) {
        console.error('Failed to send email immediately:', immediateError)
        return false
      }
    }
  }

  /**
   * Send a notification email
   */
  static async sendNotificationEmail(data: NotificationEmailData): Promise<boolean> {
    const template = this.getEmailTemplate(data)
    
    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html
    })
  }

  /**
   * Get email template based on notification type
   */
  private static getEmailTemplate(data: NotificationEmailData) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const actionButton = data.actionUrl 
      ? `<a href="${baseUrl}${data.actionUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Details</a>`
      : ''

    const templates: Partial<Record<NotificationType, { subject: string; html: string }>> = {
      UPLOAD_COMPLETED: {
        subject: `Upload Completed: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Upload Completed</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.fileSize ? `<p><strong>File Size:</strong> ${data.metadata.fileSize}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Your file has been successfully uploaded and processed.</p>
          </div>
        `
      },
      ASSET_APPROVED: {
        subject: `Asset Approved: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Asset Approved ✓</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.approvedBy ? `<p><strong>Approved by:</strong> ${data.metadata.approvedBy}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">You received this email because you uploaded this asset.</p>
          </div>
        `
      },
      ASSET_REJECTED: {
        subject: `Asset Rejected: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Asset Rejected</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.rejectedBy ? `<p><strong>Rejected by:</strong> ${data.metadata.rejectedBy}</p>` : ''}
            ${data.metadata?.reason ? `<p><strong>Reason:</strong> ${data.metadata.reason}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Please review the feedback and resubmit your asset.</p>
          </div>
        `
      },
      ASSET_SHARED: {
        subject: `Asset Shared: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Asset Shared With You</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.sharedBy ? `<p><strong>Shared by:</strong> ${data.metadata.sharedBy}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">You can now access this shared asset.</p>
          </div>
        `
      },
      COLLECTION_SHARED: {
        subject: `Collection Shared: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Collection Shared With You</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.collectionName ? `<p><strong>Collection:</strong> ${data.metadata.collectionName}</p>` : ''}
            ${data.metadata?.sharedBy ? `<p><strong>Shared by:</strong> ${data.metadata.sharedBy}</p>` : ''}
            ${data.metadata?.assetCount ? `<p><strong>Assets:</strong> ${data.metadata.assetCount} items</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">You can now access this collection from your dashboard.</p>
          </div>
        `
      },
      REVIEW_REQUESTED: {
        subject: `Review Requested: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Review Requested</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.requestedBy ? `<p><strong>Requested by:</strong> ${data.metadata.requestedBy}</p>` : ''}
            ${data.metadata?.dueDate ? `<p><strong>Due date:</strong> ${new Date(data.metadata.dueDate).toLocaleDateString()}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Please review this asset at your earliest convenience.</p>
          </div>
        `
      },
      REVIEW_ASSIGNED: {
        subject: `Review Assigned: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Review Assigned to You</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.assignedBy ? `<p><strong>Assigned by:</strong> ${data.metadata.assignedBy}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">You have been assigned to review this asset.</p>
          </div>
        `
      },
      REVIEW_COMPLETED: {
        subject: `Review Completed: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Review Completed ✓</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.reviewedBy ? `<p><strong>Reviewed by:</strong> ${data.metadata.reviewedBy}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">The review has been completed.</p>
          </div>
        `
      },
      REVIEW_CHANGES_REQUESTED: {
        subject: `Changes Requested: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Changes Requested</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.requestedBy ? `<p><strong>Requested by:</strong> ${data.metadata.requestedBy}</p>` : ''}
            ${data.metadata?.changes ? `<p><strong>Changes needed:</strong> ${data.metadata.changes}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Please make the requested changes and resubmit for review.</p>
          </div>
        `
      },
      DOWNLOAD_COMPLETED: {
        subject: `Download Completed: ${data.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Download Completed ✓</h2>
            <p>Hi ${data.userName || 'there'},</p>
            <p>${data.message}</p>
            ${data.metadata?.assetTitle ? `<p><strong>Asset:</strong> ${data.metadata.assetTitle}</p>` : ''}
            ${data.metadata?.fileSize ? `<p><strong>File Size:</strong> ${data.metadata.fileSize}</p>` : ''}
            ${actionButton}
            <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">Your download has been completed successfully.</p>
          </div>
        `
      }
    }

    const template = templates[data.type]
    return template || {
      subject: data.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${data.title}</h2>
          <p>Hi ${data.userName || 'there'},</p>
          <p>${data.message}</p>
          ${actionButton}
          <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">You received this notification from Content Hub.</p>
        </div>
      `
    }
  }

  /**
   * Simple HTML to text converter
   */
  private static htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
}

export default EmailService