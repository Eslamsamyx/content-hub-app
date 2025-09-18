'use client'

import { useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  EnvelopeIcon,
  CpuChipIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { LimitsConfig } from '@/types/admin-config'
// import { configValidator } from '@/lib/config-validation.service' // Reserved for validation

interface LimitsQuotasProps {
  limits: LimitsConfig
  onChange: (limits: LimitsConfig) => void
  errors?: { field: string; message: string }[]
  warnings?: { field: string; message: string }[]
}

export default function LimitsQuotas({ limits, onChange, errors = [], warnings = [] }: LimitsQuotasProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('storage')

  const handleFileTypesChange = (value: string) => {
    const types = value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    onChange({
      ...limits,
      storage: { ...limits.storage, allowedFileTypes: types }
    })
  }

  const getFieldError = (field: string) => {
    return errors.find(e => e.field.includes(field))?.message
  }

  const getFieldWarning = (field: string) => {
    return warnings.find(w => w.field.includes(field))?.message
  }

  const formatBytes = (mb: number): string => {
    if (mb < 1024) return `${mb} MB`
    return `${(mb / 1024).toFixed(2)} GB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AdjustmentsHorizontalIcon className="h-8 w-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">Limits & Quotas</h2>
          <p className="text-white/60">Configure system-wide limits and quotas</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Max File Size</p>
              <p className="text-white text-xl font-bold">{formatBytes(limits.storage.maxFileSize)}</p>
            </div>
            <DocumentIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-xl border border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">User Storage</p>
              <p className="text-white text-xl font-bold">{limits.storage.maxStoragePerUser} GB</p>
            </div>
            <CloudArrowUpIcon className="h-8 w-8 text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-xl border border-green-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">API Rate</p>
              <p className="text-white text-xl font-bold">{limits.api.rateLimit}/hr</p>
            </div>
            <CpuChipIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-xl rounded-xl border border-orange-500/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm">Email Daily</p>
              <p className="text-white text-xl font-bold">{limits.email.dailyLimit.toLocaleString()}</p>
            </div>
            <EnvelopeIcon className="h-8 w-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Storage Limits */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'storage' ? null : 'storage')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CloudArrowUpIcon className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Storage Limits</h3>
          </div>
          <svg 
            className={`h-5 w-5 text-white/60 transition-transform ${expandedSection === 'storage' ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'storage' && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Maximum File Size (MB)
                </label>
                <input
                  type="number"
                  value={limits.storage.maxFileSize}
                  onChange={(e) => onChange({
                    ...limits,
                    storage: { ...limits.storage, maxFileSize: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('storage.maxFileSize') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="1"
                  max="10240"
                />
                {getFieldError('storage.maxFileSize') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('storage.maxFileSize')}</p>
                )}
                {getFieldWarning('storage.maxFileSize') && (
                  <p className="text-yellow-400 text-sm mt-1">{getFieldWarning('storage.maxFileSize')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Storage Per User (GB)
                </label>
                <input
                  type="number"
                  value={limits.storage.maxStoragePerUser}
                  onChange={(e) => onChange({
                    ...limits,
                    storage: { ...limits.storage, maxStoragePerUser: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('storage.maxStoragePerUser') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="1"
                  max="10000"
                />
                {getFieldError('storage.maxStoragePerUser') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('storage.maxStoragePerUser')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Files Per Upload
                </label>
                <input
                  type="number"
                  value={limits.storage.maxFilesPerUpload}
                  onChange={(e) => onChange({
                    ...limits,
                    storage: { ...limits.storage, maxFilesPerUpload: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Allowed File Types
              </label>
              <textarea
                value={limits.storage.allowedFileTypes.join(', ')}
                onChange={(e) => handleFileTypesChange(e.target.value)}
                className={`w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                  getFieldError('storage.allowedFileTypes') 
                    ? 'border-red-500/50 focus:ring-red-500' 
                    : 'border-white/20 focus:ring-purple-500'
                }`}
                rows={3}
                placeholder="jpg, jpeg, png, gif, pdf, doc, docx..."
              />
              {getFieldError('storage.allowedFileTypes') && (
                <p className="text-red-400 text-sm mt-1">{getFieldError('storage.allowedFileTypes')}</p>
              )}
              <p className="text-white/50 text-xs mt-1">Separate file extensions with commas</p>
            </div>
            
            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/80">
                  <p className="font-medium mb-1">Storage Limits Best Practices:</p>
                  <ul className="list-disc list-inside space-y-1 text-white/60">
                    <li>Set file size limits based on your server capacity</li>
                    <li>Consider CDN limits when setting max file sizes</li>
                    <li>Restrict file types to prevent security issues</li>
                    <li>Monitor storage usage regularly</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* API Limits */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'api' ? null : 'api')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CpuChipIcon className="h-6 w-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">API Limits</h3>
          </div>
          <svg 
            className={`h-5 w-5 text-white/60 transition-transform ${expandedSection === 'api' ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'api' && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Rate Limit (requests/hour)
                </label>
                <input
                  type="number"
                  value={limits.api.rateLimit}
                  onChange={(e) => onChange({
                    ...limits,
                    api: { ...limits.api, rateLimit: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('api.rateLimit') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="10"
                  max="100000"
                />
                {getFieldError('api.rateLimit') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('api.rateLimit')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Request Timeout (ms)
                </label>
                <input
                  type="number"
                  value={limits.api.timeout}
                  onChange={(e) => onChange({
                    ...limits,
                    api: { ...limits.api, timeout: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('api.timeout') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="1000"
                  max="300000"
                  step="1000"
                />
                {getFieldError('api.timeout') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('api.timeout')}</p>
                )}
                {getFieldWarning('api.timeout') && (
                  <p className="text-yellow-400 text-sm mt-1">{getFieldWarning('api.timeout')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Request Size (MB)
                </label>
                <input
                  type="number"
                  value={limits.api.maxRequestSize}
                  onChange={(e) => onChange({
                    ...limits,
                    api: { ...limits.api, maxRequestSize: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            
            {/* Performance Indicator */}
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">API Performance</p>
                  <p className="text-white/60 text-sm mt-1">
                    Current configuration allows {Math.floor(limits.api.rateLimit / 60)} requests per minute
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-mono text-sm">
                    {(limits.api.timeout / 1000).toFixed(1)}s timeout
                  </p>
                  <p className="text-blue-400 font-mono text-sm">
                    {limits.api.maxRequestSize}MB max
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Limits */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'email' ? null : 'email')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="h-6 w-6 text-orange-400" />
            <h3 className="text-lg font-semibold text-white">Email Limits</h3>
          </div>
          <svg 
            className={`h-5 w-5 text-white/60 transition-transform ${expandedSection === 'email' ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {expandedSection === 'email' && (
          <div className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Daily Email Limit
                </label>
                <input
                  type="number"
                  value={limits.email.dailyLimit}
                  onChange={(e) => onChange({
                    ...limits,
                    email: { ...limits.email, dailyLimit: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('email.dailyLimit') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="1"
                  max="1000000"
                />
                {getFieldError('email.dailyLimit') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('email.dailyLimit')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Rate Per Second
                </label>
                <input
                  type="number"
                  value={limits.email.ratePerSecond}
                  onChange={(e) => onChange({
                    ...limits,
                    email: { ...limits.email, ratePerSecond: parseInt(e.target.value) || 0 }
                  })}
                  className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 ${
                    getFieldError('email.ratePerSecond') 
                      ? 'border-red-500/50 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500'
                  }`}
                  min="1"
                  max="1000"
                />
                {getFieldError('email.ratePerSecond') && (
                  <p className="text-red-400 text-sm mt-1">{getFieldError('email.ratePerSecond')}</p>
                )}
                {getFieldWarning('email.ratePerSecond') && (
                  <p className="text-yellow-400 text-sm mt-1">{getFieldWarning('email.ratePerSecond')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Recipients Per Email
                </label>
                <input
                  type="number"
                  value={limits.email.maxRecipients}
                  onChange={(e) => onChange({
                    ...limits,
                    email: { ...limits.email, maxRecipients: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Attachment Size (MB)
                </label>
                <input
                  type="number"
                  value={limits.email.maxAttachmentSize}
                  onChange={(e) => onChange({
                    ...limits,
                    email: { ...limits.email, maxAttachmentSize: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="50"
                />
                {getFieldWarning('limits') && getFieldWarning('limits')?.includes('attachment') && (
                  <p className="text-yellow-400 text-sm mt-1">{getFieldWarning('limits')}</p>
                )}
              </div>
            </div>
            
            {/* Email Stats */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-orange-400 text-2xl font-bold">
                    {(limits.email.dailyLimit / 24).toFixed(0)}
                  </p>
                  <p className="text-white/60 text-sm">Per Hour</p>
                </div>
                <div>
                  <p className="text-orange-400 text-2xl font-bold">
                    {(limits.email.dailyLimit / (24 * 60)).toFixed(1)}
                  </p>
                  <p className="text-white/60 text-sm">Per Minute</p>
                </div>
                <div>
                  <p className="text-orange-400 text-2xl font-bold">
                    {limits.email.ratePerSecond}
                  </p>
                  <p className="text-white/60 text-sm">Per Second</p>
                </div>
              </div>
            </div>
            
            {/* Warning for high rates */}
            {limits.email.ratePerSecond > 100 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/80">
                    <p className="font-medium text-yellow-400">High Email Rate Warning</p>
                    <p className="text-white/60 mt-1">
                      Sending more than 100 emails per second may trigger spam filters or rate limiting from email providers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Warnings/Errors */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400 mb-2">Configuration Warnings</p>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-white/60">
                    • {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400 mb-2">Configuration Errors</p>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-white/60">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}