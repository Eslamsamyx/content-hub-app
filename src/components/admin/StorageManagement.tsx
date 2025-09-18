'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FolderIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/contexts/ToastContext'
import AdminCustomDropdown from './AdminCustomDropdown'

interface StorageManagementProps {
  lng: string
}

interface S3Config {
  enabled: boolean
  region: string
  accessKeyId?: string
  secretAccessKey?: string
  bucket?: string
  serverSideEncryption?: 'AES256' | 'aws:kms'
  storageClass?: string
  maxRetries?: number
  requestTimeout?: number
  multipartThreshold?: number
  multipartChunkSize?: number
}

interface S3Metrics {
  uploads: number
  downloads: number
  deletes: number
  errors: number
  totalBandwidth: number
  lastError?: string
  lastOperation?: Date
}

interface StorageStats {
  totalSize: number
  fileCount: number
  largestFile?: { key: string; size: number }
}

export default function StorageManagement({ lng }: StorageManagementProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [config, setConfig] = useState<S3Config>({
    enabled: false,
    region: 'us-east-1',
    storageClass: 'STANDARD',
    serverSideEncryption: 'AES256',
    maxRetries: 3,
    requestTimeout: 30000,
    multipartThreshold: 104857600,
    multipartChunkSize: 10485760,
  })
  const [metrics, setMetrics] = useState<S3Metrics>({
    uploads: 0,
    downloads: 0,
    deletes: 0,
    errors: 0,
    totalBandwidth: 0,
  })
  const [stats, setStats] = useState<StorageStats>({
    totalSize: 0,
    fileCount: 0,
  })
  const [isConfigured, setIsConfigured] = useState(false)
  const [showAccessKey, setShowAccessKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; buckets?: string[] } | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      showError('Unauthorized', 'Only administrators can access storage management.')
      router.push(`/${lng}/admin`)
    }
  }, [session, router, lng, showError])

  // Load current configuration
  useEffect(() => {
    loadConfiguration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/storage/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data.config)
        setMetrics(data.metrics)
        setIsConfigured(data.isConfigured)
        
        // Load stats if configured
        if (data.isConfigured) {
          loadStorageStats()
        }
      }
    } catch (error) {
      console.error('Failed to load storage configuration:', error)
      showError('Load Failed', 'Failed to load storage configuration.')
    } finally {
      setLoading(false)
    }
  }

  const loadStorageStats = async () => {
    try {
      const response = await fetch('/api/admin/storage/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    }
  }

  const handleSaveConfig = async () => {
    // Validate required fields when S3 is enabled
    if (config.enabled) {
      if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
        showError('Missing Fields', 'Please fill in all required fields: Access Key ID, Secret Access Key, and Bucket Name')
        return
      }
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/storage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('Configuration Saved', data.message || 'Storage configuration has been updated successfully.')
        await loadConfiguration()
      } else {
        throw new Error(data.error || 'Failed to save configuration')
      }
    } catch (error: any) {
      console.error('Failed to save configuration:', error)
      showError('Save Failed', error.message || 'Failed to save storage configuration.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    
    try {
      const response = await fetch('/api/admin/storage/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()
      setTestResult(result)
      
      if (result.success) {
        showSuccess('Connection Successful', 'Successfully connected to S3.')
      } else {
        showError('Connection Failed', result.error || 'Failed to connect to S3.')
      }
    } catch (error) {
      console.error('Failed to test connection:', error)
      showError('Test Failed', 'Failed to test S3 connection.')
      setTestResult({ success: false, error: 'Network error' })
    } finally {
      setTesting(false)
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
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
        <h1 className="text-4xl font-bold text-white mb-2">Storage Management</h1>
        <p className="text-white/60">Configure and monitor your S3 storage settings</p>
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
                {isConfigured ? 'S3 Storage Configured' : 'Using Local Storage'}
              </p>
              <p className="text-white/60 text-sm">
                {isConfigured 
                  ? `Connected to ${config.bucket} in ${config.region}`
                  : 'Configure S3 for production use'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTestConnection}
            disabled={testing || !config.accessKeyId || !config.bucket}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {testing ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <CloudArrowUpIcon className="h-5 w-5" />
            )}
            Test Connection
          </button>
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
                {testResult.buckets && testResult.buckets.length > 0 && (
                  <p className="text-sm mt-1">
                    Available buckets: {testResult.buckets.slice(0, 3).join(', ')}
                    {testResult.buckets.length > 3 && ` and ${testResult.buckets.length - 3} more`}
                  </p>
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
            <ArrowUpTrayIcon className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.uploads)}</span>
          </div>
          <p className="text-white/60 text-sm">Total Uploads</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <ArrowDownTrayIcon className="h-8 w-8 text-green-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.downloads)}</span>
          </div>
          <p className="text-white/60 text-sm">Total Downloads</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-8 w-8 text-purple-400" />
            <span className="text-2xl font-bold text-white">{formatBytes(metrics.totalBandwidth)}</span>
          </div>
          <p className="text-white/60 text-sm">Bandwidth Used</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-2">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            <span className="text-2xl font-bold text-white">{formatNumber(metrics.errors)}</span>
          </div>
          <p className="text-white/60 text-sm">Errors</p>
          {metrics.lastError && (
            <p className="text-red-400 text-xs mt-1 truncate" title={metrics.lastError}>
              {metrics.lastError}
            </p>
          )}
        </div>
      </div>

      {/* Storage Stats */}
      {isConfigured && (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FolderIcon className="h-6 w-6 text-purple-400" />
            Storage Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-white/60 text-sm mb-1">Total Storage Used</p>
              <p className="text-2xl font-bold text-white">{formatBytes(stats.totalSize)}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Total Files</p>
              <p className="text-2xl font-bold text-white">{formatNumber(stats.fileCount)}</p>
            </div>
            {stats.largestFile && (
              <div>
                <p className="text-white/60 text-sm mb-1">Largest File</p>
                <p className="text-2xl font-bold text-white">{formatBytes(stats.largestFile.size)}</p>
                <p className="text-white/60 text-xs mt-1 truncate" title={stats.largestFile.key}>
                  {stats.largestFile.key.split('/').pop()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CogIcon className="h-6 w-6 text-purple-400" />
          S3 Configuration
        </h2>

        <div className="space-y-6">
          {/* Enable S3 */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
              />
              <div>
                <span className="text-white font-medium">Enable S3 Storage</span>
                <p className="text-white/60 text-sm">Use AWS S3 for file storage instead of local storage</p>
              </div>
            </label>
          </div>

          {/* AWS Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                AWS Access Key ID <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showAccessKey ? 'text' : 'password'}
                  value={config.accessKeyId || ''}
                  onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="AKIA..."
                  autoComplete="off"
                  required={config.enabled}
                />
                <button
                  type="button"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
                >
                  {showAccessKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                AWS Secret Access Key <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={config.secretAccessKey || ''}
                  onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value })}
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter secret key"
                  autoComplete="off"
                  required={config.enabled}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors"
                >
                  {showSecretKey ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bucket and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                S3 Bucket Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={config.bucket || ''}
                onChange={(e) => setConfig({ ...config, bucket: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="kayanlive-content"
                required={config.enabled}
              />
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
          </div>

          {/* Advanced Settings */}
          <details className="group">
            <summary className="cursor-pointer text-white font-medium hover:text-purple-400 transition-colors">
              Advanced Settings
            </summary>
            
            <div className="mt-4 space-y-4 pl-4 border-l-2 border-white/10">
              {/* Encryption */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Server-Side Encryption
                </label>
                <AdminCustomDropdown
                  value={config.serverSideEncryption || 'AES256'}
                  onChange={(encryption) => setConfig({ ...config, serverSideEncryption: encryption as 'AES256' | 'aws:kms' })}
                  options={[
                    { value: "AES256", label: "AES-256" },
                    { value: "aws:kms", label: "AWS KMS" }
                  ]}
                  width="w-full"
                  aria-label="Select server-side encryption"
                />
              </div>

              {/* Storage Class */}
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Storage Class
                </label>
                <AdminCustomDropdown
                  value={config.storageClass || 'STANDARD'}
                  onChange={(storageClass) => setConfig({ ...config, storageClass })}
                  options={[
                    { value: "STANDARD", label: "Standard" },
                    { value: "STANDARD_IA", label: "Standard-IA" },
                    { value: "ONEZONE_IA", label: "One Zone-IA" },
                    { value: "INTELLIGENT_TIERING", label: "Intelligent-Tiering" },
                    { value: "GLACIER", label: "Glacier" },
                    { value: "DEEP_ARCHIVE", label: "Deep Archive" }
                  ]}
                  width="w-full"
                  aria-label="Select storage class"
                />
              </div>

              {/* Performance Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Multipart Threshold (MB)
                  </label>
                  <input
                    type="number"
                    value={(config.multipartThreshold || 104857600) / 1048576}
                    onChange={(e) => setConfig({ ...config, multipartThreshold: parseInt(e.target.value) * 1048576 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="5"
                    max="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Chunk Size (MB)
                  </label>
                  <input
                    type="number"
                    value={(config.multipartChunkSize || 10485760) / 1048576}
                    onChange={(e) => setConfig({ ...config, multipartChunkSize: parseInt(e.target.value) * 1048576 })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="5"
                    max="100"
                  />
                </div>
              </div>

              {/* Transfer Acceleration removed - not supported in me-central-1 */}
            </div>
          </details>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/80">
                <p className="font-medium mb-1">Storage Configuration Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-white/60">
                  <li>Use IAM roles for production environments instead of access keys</li>
                  <li>Enable versioning and lifecycle policies in your S3 bucket</li>
                  <li>Configure CORS rules for your bucket to allow browser uploads</li>
                  <li>Consider using CloudFront CDN for faster content delivery</li>
                </ul>
              </div>
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
    </div>
  )
}