/**
 * Email Templates for Content Hub
 * Simple, responsive HTML that works across all email clients
 */

export interface EmailTemplateData {
  userName?: string
  userEmail?: string
  actionUrl?: string
  actionText?: string
  [key: string]: any
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  description: string
  variables: string[]
  category: 'auth' | 'notification' | 'review' | 'sharing' | 'system' | 'digest'
  htmlTemplate: string
  textTemplate: string
}

// Base email layout wrapper
const emailWrapper = (content: string, footerText: string = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Content Hub</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .button { background-color: #6366f1 !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; color: #6366f1; font-size: 28px; font-weight: bold;">Content Hub</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-align: center;">
                ${footerText || 'You received this email from Content Hub'}
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Content Hub. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// Button component
const emailButton = (url: string, text: string) => `
<table cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
  <tr>
    <td align="center">
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;" target="_blank">
        ${text}
      </a>
    </td>
  </tr>
</table>
`

// Alert box component
const alertBox = (content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
  const colors = {
    info: { bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
    success: { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
    warning: { bg: '#fed7aa', border: '#fb923c', text: '#92400e' },
    error: { bg: '#fee2e2', border: '#f87171', text: '#991b1b' }
  }
  const color = colors[type]
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 12px; background-color: ${color.bg}; border-left: 4px solid ${color.border}; border-radius: 4px;">
          <p style="margin: 0; color: ${color.text}; font-size: 14px;">${content}</p>
        </td>
      </tr>
    </table>
  `
}

// Export all email templates
export const emailTemplates: EmailTemplate[] = [
  // ========== Authentication Templates ==========
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Content Hub!',
    description: 'Sent when a new user signs up',
    variables: ['userName', 'actionUrl'],
    category: 'auth',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Welcome to Content Hub!</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Welcome aboard! We're excited to have you as part of our community. Content Hub is your centralized platform for managing, sharing, and collaborating on digital assets.
      </p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Here's what you can do:</p>
      <ul style="margin: 0 0 20px 20px; color: #4b5563; line-height: 1.8;">
        <li>Upload and organize your digital assets</li>
        <li>Share collections with your team</li>
        <li>Review and approve content</li>
        <li>Track asset usage and analytics</li>
      </ul>
      ${emailButton('{{actionUrl}}', 'Get Started')}
      <p style="margin: 20px 0 0 0; color: #4b5563; line-height: 1.6;">
        Need help? Check out our <a href="{{baseUrl}}/help" style="color: #6366f1;">documentation</a> or reply to this email.
      </p>
    `),
    textTemplate: `Welcome to Content Hub!

Hi {{userName}},

Welcome aboard! We're excited to have you as part of our community.

Get started: {{actionUrl}}

Best regards,
The Content Hub Team`
  },

  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    description: 'Password reset request',
    variables: ['userName', 'resetUrl', 'expiryTime'],
    category: 'auth',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Password Reset Request</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        We received a request to reset your password. Click the button below to create a new password:
      </p>
      ${emailButton('{{resetUrl}}', 'Reset Password')}
      ${alertBox('This link will expire in {{expiryTime}} hours. If you didn\'t request this, please ignore this email.', 'warning')}
      <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 14px;">
        Or copy and paste this link: <br>
        <code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">{{resetUrl}}</code>
      </p>
    `),
    textTemplate: `Password Reset Request

Hi {{userName}},

We received a request to reset your password.

Reset your password: {{resetUrl}}

This link will expire in {{expiryTime}} hours.

If you didn't request this, please ignore this email.`
  },

  {
    id: 'email-verification',
    name: 'Email Verification',
    subject: 'Verify Your Email Address',
    description: 'Email verification for new accounts',
    variables: ['userName', 'verifyUrl'],
    category: 'auth',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Verify Your Email</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Please verify your email address to complete your registration.
      </p>
      ${emailButton('{{verifyUrl}}', 'Verify Email')}
      <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
        If you're having trouble, copy and paste this link into your browser:<br>
        <code style="background-color: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 12px; word-break: break-all;">{{verifyUrl}}</code>
      </p>
    `),
    textTemplate: `Verify Your Email

Hi {{userName}},

Please verify your email address: {{verifyUrl}}

Thank you!`
  },

  // ========== Asset Review Templates ==========
  {
    id: 'review-requested',
    name: 'Review Requested',
    subject: 'Review Request: {{assetTitle}}',
    description: 'When a review is requested',
    variables: ['userName', 'assetTitle', 'requestedBy', 'dueDate', 'priority', 'reviewUrl'],
    category: 'review',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Review Requested</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        {{requestedBy}} has requested your review for:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f9fafb; border-radius: 6px;">
        <tr>
          <td style="padding: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px;">{{assetTitle}}</h3>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;"><strong>Priority:</strong> {{priority}}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Due Date:</strong> {{dueDate}}</p>
          </td>
        </tr>
      </table>
      ${emailButton('{{reviewUrl}}', 'Start Review')}
    `),
    textTemplate: `Review Requested

Hi {{userName}},

{{requestedBy}} has requested your review for: {{assetTitle}}

Priority: {{priority}}
Due Date: {{dueDate}}

Start Review: {{reviewUrl}}`
  },

  {
    id: 'review-completed',
    name: 'Review Completed',
    subject: 'Review Completed: {{assetTitle}}',
    description: 'When a review is completed',
    variables: ['userName', 'assetTitle', 'reviewedBy', 'status', 'comments', 'assetUrl'],
    category: 'review',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Review Completed</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        {{reviewedBy}} has completed the review for <strong>{{assetTitle}}</strong>.
      </p>
      ${alertBox('Status: <strong>{{status}}</strong>', 'success')}
      {{#if comments}}
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        <p style="margin: 0 0 5px 0; color: #111827; font-weight: 500;">Review Comments:</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px;">{{comments}}</p>
      </div>
      {{/if}}
      ${emailButton('{{assetUrl}}', 'View Asset')}
    `),
    textTemplate: `Review Completed

Hi {{userName}},

{{reviewedBy}} has completed the review for {{assetTitle}}.

Status: {{status}}
{{#if comments}}Comments: {{comments}}{{/if}}

View Asset: {{assetUrl}}`
  },

  // ========== Sharing Templates ==========
  {
    id: 'asset-shared',
    name: 'Asset Shared',
    subject: '{{sharedBy}} shared an asset with you',
    description: 'When an asset is shared',
    variables: ['userName', 'sharedBy', 'assetTitle', 'message', 'permissions', 'assetUrl'],
    category: 'sharing',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Asset Shared With You</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        {{sharedBy}} has shared <strong>{{assetTitle}}</strong> with you.
      </p>
      {{#if message}}
      <div style="margin: 20px 0; padding: 15px; background-color: #f9fafb; border-left: 3px solid #6366f1; border-radius: 4px;">
        <p style="margin: 0; color: #4b5563; font-style: italic;">"{{message}}"</p>
      </div>
      {{/if}}
      <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">
        <strong>Your permissions:</strong> {{permissions}}
      </p>
      ${emailButton('{{assetUrl}}', 'View Asset')}
    `),
    textTemplate: `Asset Shared With You

Hi {{userName}},

{{sharedBy}} has shared {{assetTitle}} with you.

{{#if message}}Message: {{message}}{{/if}}

Your permissions: {{permissions}}

View Asset: {{assetUrl}}`
  },

  {
    id: 'collection-shared',
    name: 'Collection Shared',
    subject: '{{sharedBy}} shared a collection with you',
    description: 'When a collection is shared',
    variables: ['userName', 'sharedBy', 'collectionName', 'assetCount', 'collectionUrl'],
    category: 'sharing',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Collection Shared With You</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        {{sharedBy}} has shared the collection <strong>{{collectionName}}</strong> with you.
      </p>
      <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 6px;">
        <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">{{collectionName}}</p>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">Contains {{assetCount}} assets</p>
      </div>
      ${emailButton('{{collectionUrl}}', 'View Collection')}
    `),
    textTemplate: `Collection Shared With You

Hi {{userName}},

{{sharedBy}} has shared the collection "{{collectionName}}" with you.

This collection contains {{assetCount}} assets.

View Collection: {{collectionUrl}}`
  },

  // ========== Notification Templates ==========
  {
    id: 'upload-completed',
    name: 'Upload Completed',
    subject: 'Upload Completed: {{assetTitle}}',
    description: 'When an upload is completed',
    variables: ['userName', 'assetTitle', 'fileSize', 'processingTime', 'assetUrl'],
    category: 'notification',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Upload Completed Successfully</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Your file has been uploaded and processed successfully.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
        <tr>
          <td style="padding: 15px; background-color: #f0fdf4; border-radius: 6px;">
            <p style="margin: 0 0 5px 0; color: #111827; font-weight: 500;">{{assetTitle}}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">Size: {{fileSize}} | Processing time: {{processingTime}}</p>
          </td>
        </tr>
      </table>
      ${emailButton('{{assetUrl}}', 'View Asset')}
    `),
    textTemplate: `Upload Completed

Hi {{userName}},

Your file "{{assetTitle}}" has been uploaded successfully.

File size: {{fileSize}}
Processing time: {{processingTime}}

View Asset: {{assetUrl}}`
  },

  {
    id: 'asset-approved',
    name: 'Asset Approved',
    subject: 'Asset Approved: {{assetTitle}}',
    description: 'When an asset is approved',
    variables: ['userName', 'assetTitle', 'approvedBy', 'approvalDate', 'assetUrl'],
    category: 'notification',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Asset Approved ✓</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Great news! Your asset has been approved.
      </p>
      ${alertBox('<strong>{{assetTitle}}</strong> was approved by {{approvedBy}} on {{approvalDate}}', 'success')}
      ${emailButton('{{assetUrl}}', 'View Asset')}
    `),
    textTemplate: `Asset Approved

Hi {{userName}},

Your asset "{{assetTitle}}" has been approved by {{approvedBy}}.

Approval Date: {{approvalDate}}

View Asset: {{assetUrl}}`
  },

  {
    id: 'asset-rejected',
    name: 'Asset Rejected',
    subject: 'Asset Requires Changes: {{assetTitle}}',
    description: 'When an asset is rejected',
    variables: ['userName', 'assetTitle', 'rejectedBy', 'reason', 'assetUrl'],
    category: 'notification',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Asset Requires Changes</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Your asset <strong>{{assetTitle}}</strong> requires some changes before approval.
      </p>
      <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px;">
        <p style="margin: 0 0 5px 0; color: #111827; font-weight: 500;">Feedback from {{rejectedBy}}:</p>
        <p style="margin: 0; color: #4b5563; font-size: 14px;">{{reason}}</p>
      </div>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Please address the feedback and resubmit your asset for review.
      </p>
      ${emailButton('{{assetUrl}}', 'View Asset')}
    `),
    textTemplate: `Asset Requires Changes

Hi {{userName}},

Your asset "{{assetTitle}}" requires changes before approval.

Feedback from {{rejectedBy}}:
{{reason}}

Please address the feedback and resubmit.

View Asset: {{assetUrl}}`
  },

  // ========== System Templates ==========
  {
    id: 'system-update',
    name: 'System Update',
    subject: 'Important: {{updateTitle}}',
    description: 'System updates and announcements',
    variables: ['updateTitle', 'updateMessage', 'actionRequired', 'actionUrl'],
    category: 'system',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">{{updateTitle}}</h2>
      <div style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">{{updateMessage}}</div>
      {{#if actionRequired}}
      ${alertBox('Action Required: {{actionRequired}}', 'warning')}
      ${emailButton('{{actionUrl}}', 'Take Action')}
      {{/if}}
    `, 'This is a system notification from Content Hub'),
    textTemplate: `{{updateTitle}}

{{updateMessage}}

{{#if actionRequired}}Action Required: {{actionRequired}}

Take Action: {{actionUrl}}{{/if}}`
  },

  {
    id: 'storage-quota-warning',
    name: 'Storage Quota Warning',
    subject: 'Storage Quota Alert',
    description: 'When approaching storage limits',
    variables: ['userName', 'usedStorage', 'totalStorage', 'percentUsed', 'upgradeUrl'],
    category: 'system',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Storage Quota Alert</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        You're approaching your storage limit.
      </p>
      <div style="margin: 20px 0; padding: 20px; background-color: #fef3c7; border-radius: 6px;">
        <p style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 500;">{{percentUsed}}% Used</p>
        <div style="background-color: #fff; border-radius: 4px; overflow: hidden; height: 20px;">
          <div style="background-color: #f59e0b; height: 100%; width: {{percentUsed}}%;"></div>
        </div>
        <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">{{usedStorage}} of {{totalStorage}}</p>
      </div>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">
        Consider cleaning up unused assets or upgrading your storage plan.
      </p>
      ${emailButton('{{upgradeUrl}}', 'Manage Storage')}
    `),
    textTemplate: `Storage Quota Alert

Hi {{userName}},

You're using {{percentUsed}}% of your storage quota.

Current usage: {{usedStorage}} of {{totalStorage}}

Manage Storage: {{upgradeUrl}}`
  },

  // ========== Digest Templates ==========
  {
    id: 'daily-digest',
    name: 'Daily Activity Digest',
    subject: 'Your Daily Content Hub Summary',
    description: 'Daily summary of activities',
    variables: ['userName', 'date', 'newAssets', 'pendingReviews', 'sharedItems', 'summaryUrl'],
    category: 'digest',
    htmlTemplate: emailWrapper(`
      <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px;">Daily Summary for {{date}}</h2>
      <p style="margin: 0 0 15px 0; color: #4b5563; line-height: 1.6;">Hi {{userName}},</p>
      <p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.6;">
        Here's your activity summary for today:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr>
          <td style="padding: 15px; background-color: #f9fafb; border-radius: 6px; width: 48%; margin-right: 4%;" valign="top">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">New Assets</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">{{newAssets}}</p>
          </td>
          <td style="width: 4%;"></td>
          <td style="padding: 15px; background-color: #f9fafb; border-radius: 6px; width: 48%;" valign="top">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Pending Reviews</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">{{pendingReviews}}</p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr>
          <td style="padding: 15px; background-color: #f9fafb; border-radius: 6px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Items Shared With You</p>
            <p style="margin: 5px 0 0 0; color: #111827; font-size: 24px; font-weight: bold;">{{sharedItems}}</p>
          </td>
        </tr>
      </table>
      ${emailButton('{{summaryUrl}}', 'View Full Summary')}
    `, 'Daily digest from Content Hub'),
    textTemplate: `Daily Summary for {{date}}

Hi {{userName}},

Today's Activity:
- New Assets: {{newAssets}}
- Pending Reviews: {{pendingReviews}}
- Items Shared With You: {{sharedItems}}

View Full Summary: {{summaryUrl}}`
  }
]

/**
 * Get a template by ID
 */
export function getEmailTemplate(templateId: string): EmailTemplate | undefined {
  return emailTemplates.find(t => t.id === templateId)
}

/**
 * Get templates by category
 */
export function getEmailTemplatesByCategory(category: EmailTemplate['category']): EmailTemplate[] {
  return emailTemplates.filter(t => t.category === category)
}

/**
 * Process template with data (simple variable replacement)
 */
export function processEmailTemplate(template: EmailTemplate, data: EmailTemplateData): {
  subject: string
  html: string
  text: string
} {
  let subject = template.subject
  let html = template.htmlTemplate
  let text = template.textTemplate

  // Replace variables in format {{variableName}}
  Object.keys(data).forEach(key => {
    const value = data[key] || ''
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(regex, value)
    html = html.replace(regex, value)
    text = text.replace(regex, value)
  })

  // Handle conditional blocks {{#if variable}} ... {{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g
  
  html = html.replace(conditionalRegex, (match, variable, content) => {
    return data[variable] ? content : ''
  })
  
  text = text.replace(conditionalRegex, (match, variable, content) => {
    return data[variable] ? content : ''
  })

  // Add base URL if not provided
  const baseUrl = data.baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  html = html.replace(/\{\{baseUrl\}\}/g, baseUrl)
  text = text.replace(/\{\{baseUrl\}\}/g, baseUrl)

  return { subject, html, text }
}

/**
 * Export template for SES
 */
export function exportTemplateForSES(template: EmailTemplate): {
  TemplateName: string
  SubjectPart: string
  HtmlPart: string
  TextPart: string
} {
  return {
    TemplateName: template.id,
    SubjectPart: template.subject,
    HtmlPart: template.htmlTemplate,
    TextPart: template.textTemplate
  }
}