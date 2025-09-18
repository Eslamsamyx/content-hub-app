'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  CheckCircleIcon,
  ArrowPathIcon,
  CogIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  QueueListIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import EmailTemplateManager from './EmailTemplateManager'
import AdminCustomDropdown from './AdminCustomDropdown'

interface EmailManagementProps {
  lng: string
}

interface SESConfig {
  enabled: boolean
  provider: 'ses' | 'smtp' | 'sendgrid' | 'mailgun'
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  fromEmail?: string
  fromName?: string
  replyToEmail?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  maxRetries?: number
  retryDelay?: number
  dailyLimit?: number
  rateLimit?: number
  sandboxMode?: boolean
  configurationSet?: string
}

interface EmailMetrics {
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

// interface EmailTemplate {
//   id: string
//   name: string
//   subject: string
//   description?: string
// }

export default function EmailManagement({ lng }: EmailManagementProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { showSuccess, showError, showWarning } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [config, setConfig] = useState<SESConfig>({
    enabled: false,
    provider: 'smtp',
    region: 'us-east-1',
    dailyLimit: 10000,
    rateLimit: 10,
    maxRetries: 3,
    retryDelay: 60000,
    sandboxMode: false,
    smtpPort: 587,
    smtpSecure: false,
  })
  const [metrics, setMetrics] = useState<EmailMetrics>({
    sent: 0,
    failed: 0,
    bounced: 0,
    complaints: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    queued: 0,
  })
  // const [templates, setTemplates] = useState<EmailTemplate[]>([]) // Reserved for future template management
  const [isConfigured, setIsConfigured] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; info?: any } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'queue'>('config')
  const [queueStatus, setQueueStatus] = useState<any>(null)

  // Check if user is admin
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      showError('Unauthorized', 'Only administrators can access email management.')
      router.push(`/${lng}/admin`)
    }
  }, [session, router, lng, showError])

  // Load current configuration
  useEffect(() => {
    loadConfiguration()
    loadQueueStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/email/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setMetrics(data.metrics)
        setIsConfigured(data.isConfigured)
        
        // Load templates if using SES
        if (data.config.provider === 'ses' && data.isConfigured) {
          loadTemplates()
        }
      }
    } catch (error) {
      console.error('Failed to load email configuration:', error)
      showError('Load Failed', 'Failed to load email configuration.')
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email/templates')
      if (response.ok) {
        // const data = await response.json()
        // setTemplates(data.templates || []) // Reserved for future template management
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadQueueStatus = async () => {
    try {
      const response = await fetch('/api/admin/email/queue')
      if (response.ok) {
        const data = await response.json()
        setQueueStatus(data)
      }
    } catch (error) {
      console.error('Failed to load queue status:', error)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/email/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        showSuccess('Configuration Saved', 'Email configuration has been updated successfully.')
        await loadConfiguration()
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
      showError('Save Failed', 'Failed to save email configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        showSuccess('Connection Successful', `Successfully connected to ${result.info?.provider || 'email service'}.`)
      } else {
        showError('Connection Failed', result.error || 'Failed to connect to email service.')
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      showError('Test Failed', 'Failed to test email connection.')
      setTestResult({ success: false, error: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      showWarning('Email Required', 'Please enter an email address to send test to.')
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch('/api/admin/email/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail }),
      })

      if (response.ok) {
        showSuccess('Test Email Sent', `Test email has been sent to ${testEmail}.`)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send test email')
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error)
      showError('Send Failed', error.message || 'Failed to send test email.')
    } finally {
      setSendingTest(false)
    }
  }

  const handleClearQueue = async () => {
    if (!confirm('Are you sure you want to clear the email queue? This will remove all pending emails.')) {
      return
    }

    try {
      const response = await fetch('/api/admin/email/queue', {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess('Queue Cleared', 'Email queue has been cleared successfully.')
        await loadQueueStatus()
      } else {
        throw new Error('Failed to clear queue')
      }
    } catch (error) {
      console.error('Failed to clear queue:', error)
      showError('Clear Failed', 'Failed to clear email queue.')
    }
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(num)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/4 mb-8"></div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
            <div className="space-y-4">
              <div className="h-10 bg-white/10 rounded"></div>
              <div className="h-10 bg-white/10 rounded"></div>
              <div className="h-10 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Email Management</h1>
        <p className="text-white/60">Configure and monitor your email service settings</p>
      </div>

      {/* Status Banner */}
      <div className={`mb-8 p-4 rounded-xl border ${
        isConfigured 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-yellow-500/10 border-yellow-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
            )}
            <div>
              <p className="text-white font-medium">
                {isConfigured ? `Email Service Configured (${config.provider?.toUpperCase()})` : 'Email Service Not Configured'}
              </p>
              <p className="text-white/60 text-sm">
                {isConfigured 
                  ? config.sandboxMode ? 'Running in Sandbox Mode' : `Sending from ${config.fromEmail}`
                  : 'Configure email service for notifications'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || (!config.provider)}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {testing ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <BoltIcon className="h-5 w-5" />
              )}
              Test Connection
            </button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg ${
            testResult.success 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {testResult.success ? (
              <div>
                <p className="font-medium">✅ Connection successful!</p>
                {testResult.info && (
                  <div className="text-sm mt-1">
                    {testResult.info.provider && <p>Provider: {testResult.info.provider}</p>}
                    {testResult.info.quota && (
                      <p>Quota: {testResult.info.quota.sentLast24Hours}/{testResult.info.quota.max24HourSend} sent (Rate: {testResult.info.quota.maxSendRate}/sec)</p>
                    )}
                    {testResult.info.verifiedEmails && (
                      <p>Verified: {testResult.info.verifiedEmails.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p>❌ {testResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <PaperAirplaneIcon className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.sent)}</span>
          </div>
          <p className="text-white/60 text-sm">Emails Sent</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <QueueListIcon className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.queued)}</span>
          </div>
          <p className="text-white/60 text-sm">In Queue</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.delivered)}</span>
          </div>
          <p className="text-white/60 text-sm">Delivered</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.failed + metrics.bounced)}</span>
          </div>
          <p className="text-white/60 text-sm">Failed/Bounced</p>
          {metrics.lastError && (
            <p className="text-red-400 text-xs mt-1 truncate" title={metrics.lastError}>
              {metrics.lastError}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'config'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'queue'
              ? 'bg-purple-600 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Queue Status
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CogIcon className="h-6 w-6 text-purple-400" />
            Email Configuration
          </h2>

          <div className="space-y-6">
            {/* Enable Email */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-white font-medium">Enable Email Service</span>
                  <p className="text-white/60 text-sm">Send transactional emails and notifications</p>
                </div>
              </label>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Provider
              </label>
              <AdminCustomDropdown
                value={config.provider}
                onChange={(provider) => setConfig({ ...config, provider: provider as any })}
                options={[
                  { value: "smtp", label: "SMTP" },
                  { value: "ses", label: "AWS SES" },
                  { value: "sendgrid", label: "SendGrid" },
                  { value: "mailgun", label: "Mailgun" }
                ]}
                width="w-full"
                aria-label="Select email provider"
              />
            </div>

            {/* Provider-specific settings */}
            {config.provider === 'ses' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      AWS Access Key ID
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={config.accessKeyId || ''}
                      onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="AKIA..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      AWS Secret Access Key
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={config.secretAccessKey || ''}
                      onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter secret key"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    AWS Region
                  </label>
                  <AdminCustomDropdown
                    value={config.region}
                    onChange={(region) => setConfig({ ...config, region })}
                    options={[
                      { value: "us-east-1", label: "US East (N. Virginia)" },
                      { value: "us-west-2", label: "US West (Oregon)" },
                      { value: "eu-west-1", label: "EU (Ireland)" },
                      { value: "eu-central-1", label: "EU (Frankfurt)" },
                      { value: "me-central-1", label: "Middle East (UAE)" },
                      { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
                      { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" }
                    ]}
                    width="w-full"
                    aria-label="Select AWS region"
                  />
                </div>
              </>
            )}

            {config.provider === 'smtp' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={config.smtpHost || ''}
                      onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={config.smtpPort || 587}
                      onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      SMTP Username
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={config.smtpUser || ''}
                      onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      SMTP Password
                    </label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      value={config.smtpPassword || ''}
                      onChange={(e) => setConfig({ ...config, smtpPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="password"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.smtpSecure || false}
                    onChange={(e) => setConfig({ ...config, smtpSecure: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white font-medium">Use TLS/SSL</span>
                    <p className="text-white/60 text-sm">Enable secure connection</p>
                  </div>
                </label>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowSecrets(!showSecrets)}
              className="text-sm text-purple-400 hover:text-purple-300"
            >
              {showSecrets ? 'Hide' : 'Show'} credentials
            </button>

            {/* Common Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  From Email *
                </label>
                <input
                  type="email"
                  value={config.fromEmail || ''}
                  onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="noreply@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  From Name
                </label>
                <input
                  type="text"
                  value={config.fromName || ''}
                  onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Content Hub"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Reply-To Email
              </label>
              <input
                type="email"
                value={config.replyToEmail || ''}
                onChange={(e) => setConfig({ ...config, replyToEmail: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="support@example.com"
              />
            </div>

            {/* Advanced Settings */}
            <details className="group">
              <summary className="cursor-pointer text-white font-medium hover:text-purple-400 transition-colors">
                Advanced Settings
              </summary>
              
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-white/10">
                {/* Sandbox Mode */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sandboxMode || false}
                    onChange={(e) => setConfig({ ...config, sandboxMode: e.target.checked })}
                    className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white font-medium">Sandbox Mode</span>
                    <p className="text-white/60 text-sm">Log emails instead of sending (for testing)</p>
                  </div>
                </label>

                {/* Rate Limiting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Daily Limit
                    </label>
                    <input
                      type="number"
                      value={config.dailyLimit || 10000}
                      onChange={(e) => setConfig({ ...config, dailyLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="100000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Rate Limit (per second)
                    </label>
                    <input
                      type="number"
                      value={config.rateLimit || 10}
                      onChange={(e) => setConfig({ ...config, rateLimit: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                {/* Retry Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      value={config.maxRetries || 3}
                      onChange={(e) => setConfig({ ...config, maxRetries: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      Retry Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={config.retryDelay || 60000}
                      onChange={(e) => setConfig({ ...config, retryDelay: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1000"
                      max="600000"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Test Email */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Send Test Email</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={sendingTest || !testEmail || !isConfigured}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                >
                  {sendingTest ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    'Send Test'
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
              <button
                onClick={loadConfiguration}
                className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <EmailTemplateManager 
            provider={config.provider}
            isConfigured={isConfigured}
            onUploadTemplate={async (template) => {
              // Upload template to SES
              const response = await fetch('/api/admin/email/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(template),
              })
              
              if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to upload template')
              }
            }}
          />
        </div>
      )}

      {/* Queue Status Tab */}
      {activeTab === 'queue' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <QueueListIcon className="h-6 w-6 text-purple-400" />
              Email Queue Status
            </h2>
            {queueStatus?.enabled && (
              <button
                onClick={handleClearQueue}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                Clear Queue
              </button>
            )}
          </div>

          {queueStatus?.enabled ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-1">Waiting</p>
                <p className="text-2xl font-bold text-white">{formatNumber(queueStatus.waiting || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-1">Active</p>
                <p className="text-2xl font-bold text-white">{formatNumber(queueStatus.active || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-1">Completed</p>
                <p className="text-2xl font-bold text-white">{formatNumber(queueStatus.completed || 0)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm mb-1">Failed</p>
                <p className="text-2xl font-bold text-white">{formatNumber(queueStatus.failed || 0)}</p>
              </div>
            </div>
          ) : (
            <p className="text-white/60">Email queue is not enabled. Configure Redis to enable email queueing.</p>
          )}
        </div>
      )}
    </div>
  )
}