'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheckIcon,
  KeyIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  ClockIcon,
  FingerPrintIcon,
  CloudArrowUpIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import { SecurityConfig } from '@/types/admin-config'
import AdminCustomDropdown from './AdminCustomDropdown'

interface SecurityManagementProps {
  lng: string
}

export default function SecurityManagement({ lng }: SecurityManagementProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { showSuccess, showError, showWarning } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'authentication' | 'apikeys' | 'audit'>('authentication')
  const [config, setConfig] = useState<SecurityConfig>({
    authentication: {
      enableTwoFactor: false,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 30,
    },
    password: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: false,
      expiryDays: 90,
      preventReuse: 3,
    },
    credentials: {
      aws: {},
      apiKeys: [],
    },
  })
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [newApiKey, setNewApiKey] = useState({ name: '', permissions: [] as string[] })
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      showError('Unauthorized', 'Only administrators can access security management.')
      router.push(`/${lng}/admin`)
    }
  }, [session, router, lng, showError])

  // Load configuration
  useEffect(() => {
    loadConfiguration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/security/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config || config)
        if (activeTab === 'audit') {
          loadAuditLogs()
        }
      }
    } catch (error) {
      console.error('Failed to load security configuration:', error)
      showError('Load Failed', 'Failed to load security configuration.')
    } finally {
      setLoading(false)
    }
  }

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/admin/audit/logs')
      if (response.ok) {
        const data = await response.json()
        setAuditLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/security/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        showSuccess('Configuration Saved', 'Security configuration has been updated successfully.')
        await loadConfiguration()
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save configuration:', error)
      showError('Save Failed', 'Failed to save security configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateApiKey = async () => {
    if (!newApiKey.name) {
      showWarning('Name Required', 'Please enter a name for the API key.')
      return
    }

    try {
      const response = await fetch('/api/admin/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newApiKey.name,
          permissions: newApiKey.permissions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedKey(data.key)
        showSuccess('API Key Generated', 'New API key has been created. Copy it now as it won\'t be shown again.')
        setNewApiKey({ name: '', permissions: [] })
        await loadConfiguration()
      } else {
        throw new Error('Failed to generate API key')
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
      showError('Generation Failed', 'Failed to generate API key.')
    }
  }

  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/security/api-keys/${keyId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess('API Key Revoked', 'API key has been revoked successfully.')
        await loadConfiguration()
      } else {
        throw new Error('Failed to revoke API key')
      }
    } catch (error) {
      console.error('Failed to revoke API key:', error)
      showError('Revoke Failed', 'Failed to revoke API key.')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess('Copied', 'Copied to clipboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (session?.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheckIcon className="h-8 w-8 text-purple-400" />
            Security Management
          </h2>
          <p className="text-white/60 mt-1">Manage authentication, API keys, and security policies</p>
        </div>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Two-Factor Auth</p>
              <p className="text-white font-semibold">
                {config.authentication.enableTwoFactor ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <FingerPrintIcon className={`h-8 w-8 ${
              config.authentication.enableTwoFactor ? 'text-green-400' : 'text-yellow-400'
            }`} />
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">API Keys</p>
              <p className="text-white font-semibold">{config.credentials.apiKeys.length} Active</p>
            </div>
            <KeyIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Session Timeout</p>
              <p className="text-white font-semibold">{config.authentication.sessionTimeout} min</p>
            </div>
            <ClockIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => window.location.href = window.location.href.replace('#security', '#storage')}
          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CloudArrowUpIcon className="h-8 w-8 text-blue-400" />
            <div className="text-left">
              <p className="text-white font-medium">S3 Storage Settings</p>
              <p className="text-white/60 text-sm">Configure AWS S3 credentials and storage settings</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-400 text-sm">Go to Storage →</p>
          </div>
        </button>
        
        <button 
          onClick={() => window.location.href = window.location.href.replace('#security', '#email')}
          className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-8 w-8 text-orange-400" />
            <div className="text-left">
              <p className="text-white font-medium">Email Configuration</p>
              <p className="text-white/60 text-sm">Configure SES, SMTP, and email credentials</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-orange-400 text-sm">Go to Email →</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('authentication')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'authentication'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          Authentication & Passwords
        </button>
        <button
          onClick={() => setActiveTab('apikeys')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'apikeys'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => {
            setActiveTab('audit')
            loadAuditLogs()
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'audit'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          System Audit Logs
        </button>
      </div>

      {/* Authentication Tab */}
      {activeTab === 'authentication' && (
        <div className="space-y-6">
          {/* Authentication Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Authentication Settings</h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.authentication.enableTwoFactor}
                  onChange={(e) => setConfig({
                    ...config,
                    authentication: {
                      ...config.authentication,
                      enableTwoFactor: e.target.checked,
                    }
                  })}
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-white font-medium">Enable Two-Factor Authentication</span>
                  <p className="text-white/60 text-sm">Require 2FA for all admin users</p>
                </div>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.authentication.sessionTimeout}
                    onChange={(e) => setConfig({
                      ...config,
                      authentication: {
                        ...config.authentication,
                        sessionTimeout: parseInt(e.target.value),
                      }
                    })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="5"
                    max="1440"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Max Login Attempts
                  </label>
                  <input
                    type="number"
                    value={config.authentication.maxLoginAttempts}
                    onChange={(e) => setConfig({
                      ...config,
                      authentication: {
                        ...config.authentication,
                        maxLoginAttempts: parseInt(e.target.value),
                      }
                    })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="3"
                    max="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Lockout Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={config.authentication.lockoutDuration}
                    onChange={(e) => setConfig({
                      ...config,
                      authentication: {
                        ...config.authentication,
                        lockoutDuration: parseInt(e.target.value),
                      }
                    })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="5"
                    max="1440"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Password Policy</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Minimum Length
                  </label>
                  <input
                    type="number"
                    value={config.password.minLength}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        minLength: parseInt(e.target.value),
                      }
                    })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="6"
                    max="32"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Password Expiry (days)
                  </label>
                  <input
                    type="number"
                    value={config.password.expiryDays}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        expiryDays: parseInt(e.target.value),
                      }
                    })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max="365"
                  />
                  <p className="text-white/50 text-xs mt-1">Set to 0 to disable expiry</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.password.requireUppercase}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        requireUppercase: e.target.checked,
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Require uppercase letters</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.password.requireLowercase}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        requireLowercase: e.target.checked,
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Require lowercase letters</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.password.requireNumbers}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        requireNumbers: e.target.checked,
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Require numbers</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.password.requireSymbols}
                    onChange={(e) => setConfig({
                      ...config,
                      password: {
                        ...config.password,
                        requireSymbols: e.target.checked,
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Require special characters</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Prevent Password Reuse
                </label>
                <AdminCustomDropdown
                  value={config.password.preventReuse.toString()}
                  onChange={(value) => setConfig({
                    ...config,
                    password: {
                      ...config.password,
                      preventReuse: parseInt(value),
                    }
                  })}
                  options={[
                    { value: "0", label: "Disabled" },
                    { value: "3", label: "Last 3 passwords" },
                    { value: "5", label: "Last 5 passwords" },
                    { value: "10", label: "Last 10 passwords" }
                  ]}
                  width="w-full"
                  aria-label="Prevent password reuse"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'apikeys' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>
          
          {/* Generate New Key */}
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <h4 className="text-white/80 font-medium mb-3">Generate New API Key</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Key name (e.g., Production API)"
                />
              </div>
              <div>
                <button
                  onClick={handleGenerateApiKey}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  Generate Key
                </button>
              </div>
            </div>
            
            {generatedKey && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 font-medium mb-2">New API Key Generated!</p>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-black/30 rounded text-green-400 font-mono text-sm">
                    {generatedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(generatedKey)}
                    className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 rounded transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5 text-green-400" />
                  </button>
                </div>
                <p className="text-yellow-400 text-sm mt-2">
                  ⚠️ Copy this key now. It won&apos;t be shown again!
                </p>
              </div>
            )}
          </div>

          {/* Existing Keys */}
          <div className="space-y-3">
            {config.credentials.apiKeys.map((key: any) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">{key.name}</p>
                  <p className="text-white/60 text-sm">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                    {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">Expired</span>
                  )}
                  <button
                    onClick={() => handleRevokeApiKey(key.id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
            
            {config.credentials.apiKeys.length === 0 && (
              <p className="text-white/60 text-center py-4">No API keys generated yet</p>
            )}
          </div>
        </div>
      )}

      {/* System Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">System Audit Logs</h3>
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
          
          <div className="space-y-3">
            {auditLogs.map((log, index) => (
              <div key={log.id || index} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                        log.level === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                        log.level === 'info' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {log.level || 'info'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.category === 'auth' ? 'bg-purple-500/20 text-purple-400' :
                        log.category === 'config' ? 'bg-blue-500/20 text-blue-400' :
                        log.category === 'storage' ? 'bg-green-500/20 text-green-400' :
                        log.category === 'email' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {log.category || 'system'}
                      </span>
                    </div>
                    <p className="text-white font-medium">
                      {log.action || log.message || 'System activity'}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      {log.userEmail ? `by ${log.userEmail}` : 'System'} • {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.details && (
                      <div className="mt-2 text-sm text-white/70">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </div>
                    )}
                    {log.oldValue && log.newValue && (
                      <div className="mt-2 text-sm">
                        <span className="text-red-400">From: {JSON.stringify(log.oldValue)}</span>
                        <span className="text-white/50 mx-2">→</span>
                        <span className="text-green-400">To: {JSON.stringify(log.newValue)}</span>
                      </div>
                    )}
                  </div>
                  {log.ipAddress && (
                    <div className="text-right text-sm text-white/50">
                      {log.ipAddress}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {auditLogs.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/60">No system logs recorded yet</p>
                <p className="text-white/40 text-sm mt-1">
                  System activities, configuration changes, and security events will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <button
          onClick={loadConfiguration}
          className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          Reset Changes
        </button>
        <button
          onClick={handleSaveConfig}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  )
}