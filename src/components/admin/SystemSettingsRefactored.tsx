'use client'

import { useState, useEffect } from 'react'
import { 
  CogIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ServerIcon,
  DocumentDuplicateIcon,
  BellAlertIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { UnifiedAdminConfig } from '@/types/admin-config'
import LimitsQuotas from './LimitsQuotas'
import { configValidator } from '@/lib/config-validation.service'
import { useToast } from '@/contexts/ToastContext'
import AdminCustomDropdown from './AdminCustomDropdown'

interface SystemSettingsRefactoredProps {
  lng?: string
}

export default function SystemSettingsRefactored({ }: SystemSettingsRefactoredProps) {
  const { showSuccess, showError } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'limits' | 'backup'>('general')
  const [validationResult, setValidationResult] = useState<any>({ errors: [], warnings: [] })
  
  const [config, setConfig] = useState<Partial<UnifiedAdminConfig>>({
    general: {
      siteName: 'Content Hub',
      siteDescription: 'Your digital asset management platform',
      maintenanceMode: false,
      allowRegistration: true,
    },
    limits: {
      storage: {
        maxFileSize: 100,
        maxStoragePerUser: 10,
        allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'mp4', 'mov'],
        maxFilesPerUpload: 10,
      },
      api: {
        rateLimit: 1000,
        timeout: 30000,
        maxRequestSize: 50,
      },
      email: {
        dailyLimit: 10000,
        ratePerSecond: 10,
        maxRecipients: 50,
        maxAttachmentSize: 25,
      },
    },
    backup: {
      autoBackup: true,
      frequency: 'daily',
      retentionDays: 30,
      includeUserData: true,
      includeAssets: true,
      backupLocation: 'local',
      notifications: {
        onSuccess: false,
        onFailure: true,
        email: '',
      },
    },
  })

  useEffect(() => {
    loadConfiguration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Validate configuration whenever it changes
    const result = configValidator.validateConfiguration(config)
    setValidationResult(result)
  }, [config])

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/config/unified')
      if (response.ok) {
        const data = await response.json()
        if (data.config) {
          setConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error)
      showError('Load Failed', 'Failed to load system configuration.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validate before saving
    const validation = configValidator.validateConfiguration(config)
    if (!validation.valid) {
      showError('Validation Failed', 'Please fix the errors before saving.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/config/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        showSuccess('Settings Saved', 'System settings have been updated successfully.')
        await loadConfiguration()
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      showError('Save Failed', 'Failed to save system settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadConfiguration()
    showSuccess('Settings Reset', 'Settings have been reset to last saved values.')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CogIcon className="h-8 w-8 text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            <p className="text-white/60">Configure general settings, limits, and backup options</p>
          </div>
        </div>
        
        {/* Validation Status */}
        <div className="flex items-center gap-2">
          {validationResult.errors.length > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <span className="text-red-400 text-sm">{validationResult.errors.length} errors</span>
            </div>
          ) : validationResult.warnings.length > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm">{validationResult.warnings.length} warnings</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
              <span className="text-green-400 text-sm">Valid configuration</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'general'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5" />
            General
          </div>
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'limits'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <ServerIcon className="h-5 w-5" />
            Limits & Quotas
          </div>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'backup'
              ? 'text-white border-b-2 border-purple-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CloudArrowUpIcon className="h-5 w-5" />
            Backup & Recovery
          </div>
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && config.general && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-6 w-6 text-purple-400" />
              General Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={config.general.siteName}
                  onChange={(e) => setConfig({
                    ...config,
                    general: { ...config.general!, siteName: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Content Hub"
                />
                {validationResult.errors.find((e: any) => e.field === 'general.siteName') && (
                  <p className="text-red-400 text-sm mt-1">
                    {validationResult.errors.find((e: any) => e.field === 'general.siteName').message}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Site Description
                </label>
                <textarea
                  value={config.general.siteDescription || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    general: { ...config.general!, siteDescription: e.target.value }
                  })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Your digital asset management platform"
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.general.maintenanceMode}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general!, maintenanceMode: e.target.checked }
                    })}
                    className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white font-medium">Maintenance Mode</span>
                    <p className="text-white/60 text-sm">Temporarily disable access for non-admin users</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.general.allowRegistration}
                    onChange={(e) => setConfig({
                      ...config,
                      general: { ...config.general!, allowRegistration: e.target.checked }
                    })}
                    className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-white font-medium">Allow Registration</span>
                    <p className="text-white/60 text-sm">Allow new users to create accounts</p>
                  </div>
                </label>
              </div>
              
              {validationResult.warnings.find((w: any) => w.field === 'general') && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ {validationResult.warnings.find((w: any) => w.field === 'general').message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Limits & Quotas Tab */}
      {activeTab === 'limits' && config.limits && (
        <LimitsQuotas
          limits={config.limits}
          onChange={(limits) => setConfig({ ...config, limits })}
          errors={validationResult.errors.filter((e: any) => e.field.startsWith('limits'))}
          warnings={validationResult.warnings.filter((w: any) => w.field.startsWith('limits'))}
        />
      )}

      {/* Backup & Recovery Tab */}
      {activeTab === 'backup' && config.backup && (
        <div className="space-y-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <CloudArrowUpIcon className="h-6 w-6 text-purple-400" />
              Backup Settings
            </h3>
            
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.backup.autoBackup}
                  onChange={(e) => setConfig({
                    ...config,
                    backup: { ...config.backup!, autoBackup: e.target.checked }
                  })}
                  className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="text-white font-medium">Enable Automatic Backups</span>
                  <p className="text-white/60 text-sm">Automatically backup data at scheduled intervals</p>
                </div>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Backup Frequency
                  </label>
                  <AdminCustomDropdown
                    value={config.backup.frequency}
                    onChange={(frequency) => setConfig({
                      ...config,
                      backup: { ...config.backup!, frequency: frequency as any }
                    })}
                    options={[
                      { value: "hourly", label: "Hourly", disabled: !config.backup.autoBackup },
                      { value: "daily", label: "Daily", disabled: !config.backup.autoBackup },
                      { value: "weekly", label: "Weekly", disabled: !config.backup.autoBackup },
                      { value: "monthly", label: "Monthly", disabled: !config.backup.autoBackup }
                    ]}
                    disabled={!config.backup.autoBackup}
                    width="w-full"
                    aria-label="Select backup frequency"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    value={config.backup.retentionDays}
                    onChange={(e) => setConfig({
                      ...config,
                      backup: { ...config.backup!, retentionDays: parseInt(e.target.value) || 0 }
                    })}
                    disabled={!config.backup.autoBackup}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                    min="1"
                    max="365"
                  />
                  {validationResult.errors.find((e: any) => e.field === 'backup.retentionDays') && (
                    <p className="text-red-400 text-sm mt-1">
                      {validationResult.errors.find((e: any) => e.field === 'backup.retentionDays').message}
                    </p>
                  )}
                  {validationResult.warnings.find((w: any) => w.field === 'backup.retentionDays') && (
                    <p className="text-yellow-400 text-sm mt-1">
                      {validationResult.warnings.find((w: any) => w.field === 'backup.retentionDays').message}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Backup Location
                </label>
                <AdminCustomDropdown
                  value={config.backup.backupLocation}
                  onChange={(location) => setConfig({
                    ...config,
                    backup: { ...config.backup!, backupLocation: location as any }
                  })}
                  options={[
                    { value: "local", label: "Local Storage", disabled: !config.backup.autoBackup },
                    { value: "s3", label: "Amazon S3", disabled: !config.backup.autoBackup },
                    { value: "external", label: "External Server", disabled: !config.backup.autoBackup }
                  ]}
                  disabled={!config.backup.autoBackup}
                  width="w-full"
                  aria-label="Select backup location"
                />
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/90">Include in Backup:</p>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backup.includeUserData}
                    onChange={(e) => setConfig({
                      ...config,
                      backup: { ...config.backup!, includeUserData: e.target.checked }
                    })}
                    disabled={!config.backup.autoBackup}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className="text-white">User Data (profiles, preferences, activities)</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backup.includeAssets}
                    onChange={(e) => setConfig({
                      ...config,
                      backup: { ...config.backup!, includeAssets: e.target.checked }
                    })}
                    disabled={!config.backup.autoBackup}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 disabled:opacity-50"
                  />
                  <span className="text-white">Assets & Files (may require significant storage)</span>
                </label>
              </div>
              
              {validationResult.warnings.find((w: any) => w.field === 'backup' && w.message.includes('No data selected')) && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ {validationResult.warnings.find((w: any) => w.field === 'backup').message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup Notifications */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <BellAlertIcon className="h-6 w-6 text-purple-400" />
              Backup Notifications
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backup.notifications.onSuccess}
                    onChange={(e) => setConfig({
                      ...config,
                      backup: {
                        ...config.backup!,
                        notifications: {
                          ...config.backup!.notifications,
                          onSuccess: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Notify on successful backup</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backup.notifications.onFailure}
                    onChange={(e) => setConfig({
                      ...config,
                      backup: {
                        ...config.backup!,
                        notifications: {
                          ...config.backup!.notifications,
                          onFailure: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                  <span className="text-white">Notify on backup failure</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Notification Email
                </label>
                <input
                  type="email"
                  value={config.backup.notifications.email || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    backup: {
                      ...config.backup!,
                      notifications: {
                        ...config.backup!.notifications,
                        email: e.target.value
                      }
                    }
                  })}
                  disabled={!config.backup.notifications.onSuccess && !config.backup.notifications.onFailure}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="admin@example.com"
                />
                {validationResult.errors.find((e: any) => e.field === 'backup.notifications.email') && (
                  <p className="text-red-400 text-sm mt-1">
                    {validationResult.errors.find((e: any) => e.field === 'backup.notifications.email').message}
                  </p>
                )}
              </div>
              
              {validationResult.warnings.find((w: any) => w.field === 'backup.notifications') && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    ⚠️ {validationResult.warnings.find((w: any) => w.field === 'backup.notifications').message}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Backup Status */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Last Backup</p>
                <p className="text-white/60 text-sm mt-1">Never performed</p>
              </div>
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  Backup Now
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          disabled={saving || validationResult.errors.length > 0}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}