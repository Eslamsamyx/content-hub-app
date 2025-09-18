'use client'

import { useState, useEffect } from 'react'
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import { emailTemplates, processEmailTemplate, exportTemplateForSES, EmailTemplate } from '@/lib/email-templates'
import { useToast } from '@/contexts/ToastContext'
import AdminCustomDropdown from './AdminCustomDropdown'

interface EmailTemplateManagerProps {
  provider: string
  isConfigured: boolean
  onUploadTemplate?: (template: any) => Promise<void>
}

export default function EmailTemplateManager({ provider, isConfigured, onUploadTemplate }: EmailTemplateManagerProps) {
  const { showSuccess, showError, showInfo } = useToast()
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [previewData, setPreviewData] = useState<Record<string, string>>({})  
  const [showPreview, setShowPreview] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')
  const [uploadedTemplates, setUploadedTemplates] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState<string | null>(null)

  const categories = [
    { id: 'all', name: 'All Templates', count: emailTemplates.length },
    { id: 'auth', name: 'Authentication', count: emailTemplates.filter(t => t.category === 'auth').length },
    { id: 'notification', name: 'Notifications', count: emailTemplates.filter(t => t.category === 'notification').length },
    { id: 'review', name: 'Reviews', count: emailTemplates.filter(t => t.category === 'review').length },
    { id: 'sharing', name: 'Sharing', count: emailTemplates.filter(t => t.category === 'sharing').length },
    { id: 'system', name: 'System', count: emailTemplates.filter(t => t.category === 'system').length },
    { id: 'digest', name: 'Digests', count: emailTemplates.filter(t => t.category === 'digest').length },
  ]

  const filteredTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  useEffect(() => {
    // Load uploaded templates from localStorage or API
    const saved = localStorage.getItem('uploadedEmailTemplates')
    if (saved) {
      setUploadedTemplates(new Set(JSON.parse(saved)))
    }
  }, [])

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    // Initialize preview data with empty values for all variables
    const data: Record<string, string> = {}
    template.variables.forEach(variable => {
      data[variable] = getSampleData(variable)
    })
    setPreviewData(data)
  }

  const getSampleData = (variable: string): string => {
    const samples: Record<string, string> = {
      userName: 'John Doe',
      userEmail: 'john.doe@example.com',
      assetTitle: 'Product Launch Video',
      assetUrl: 'https://content-hub.com/assets/123',
      actionUrl: 'https://content-hub.com/action',
      actionText: 'View Details',
      collectionName: 'Marketing Materials Q1',
      collectionUrl: 'https://content-hub.com/collections/456',
      sharedBy: 'Jane Smith',
      approvedBy: 'Mike Johnson',
      rejectedBy: 'Sarah Williams',
      reviewedBy: 'Tom Brown',
      requestedBy: 'Alice Cooper',
      assignedBy: 'Bob Wilson',
      resetUrl: 'https://content-hub.com/reset/abc123',
      verifyUrl: 'https://content-hub.com/verify/xyz789',
      reviewUrl: 'https://content-hub.com/review/789',
      upgradeUrl: 'https://content-hub.com/upgrade',
      summaryUrl: 'https://content-hub.com/summary',
      expiryTime: '24',
      fileSize: '25.4 MB',
      processingTime: '2.3 seconds',
      approvalDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      priority: 'High',
      status: 'Approved',
      reason: 'Please improve the image quality and add proper metadata.',
      comments: 'Great work! The asset meets all our quality standards.',
      message: 'Check out this amazing content I found!',
      permissions: 'View, Download',
      assetCount: '24',
      updateTitle: 'System Maintenance Scheduled',
      updateMessage: 'We will be performing system maintenance on Saturday from 2 AM to 4 AM EST.',
      actionRequired: 'Please save your work before the maintenance window.',
      usedStorage: '8.5 GB',
      totalStorage: '10 GB',
      percentUsed: '85',
      date: new Date().toLocaleDateString(),
      newAssets: '12',
      pendingReviews: '5',
      sharedItems: '3',
    }
    return samples[variable] || `{{${variable}}}`
  }

  const handlePreview = () => {
    if (!selectedTemplate) return
    setShowPreview(true)
  }

  const getProcessedTemplate = () => {
    if (!selectedTemplate) return { subject: '', html: '', text: '' }
    return processEmailTemplate(selectedTemplate, previewData)
  }

  const handleUploadToSES = async (template: EmailTemplate) => {
    if (!onUploadTemplate) {
      showInfo('Not Available', 'Template upload is only available with AWS SES provider.')
      return
    }

    setUploading(template.id)
    try {
      const sesTemplate = exportTemplateForSES(template)
      await onUploadTemplate(sesTemplate)
      
      // Mark as uploaded
      const newUploaded = new Set(uploadedTemplates).add(template.id)
      setUploadedTemplates(newUploaded)
      localStorage.setItem('uploadedEmailTemplates', JSON.stringify(Array.from(newUploaded)))
      
      showSuccess('Template Uploaded', `Template "${template.name}" has been uploaded to SES.`)
    } catch (error: any) {
      showError('Upload Failed', error.message || 'Failed to upload template to SES.')
    } finally {
      setUploading(null)
    }
  }

  const handleUploadAll = async () => {
    if (!onUploadTemplate) {
      showInfo('Not Available', 'Template upload is only available with AWS SES provider.')
      return
    }

    for (const template of filteredTemplates) {
      if (!uploadedTemplates.has(template.id)) {
        await handleUploadToSES(template)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Email Templates</h3>
          <p className="text-sm text-white/60 mt-1">
            {provider === 'ses' 
              ? 'Manage and upload email templates to AWS SES'
              : `Email templates (upload available with AWS SES)`
            }
          </p>
        </div>
        {provider === 'ses' && isConfigured && (
          <button
            onClick={handleUploadAll}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            Upload All to SES
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-all duration-200"
          />
        </div>
        <AdminCustomDropdown
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories.map(cat => ({
            value: cat.id,
            label: `${cat.name} (${cat.count})`
          }))}
          width="w-56"
          aria-label="Filter by category"
        />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className={`bg-white/5 rounded-xl border transition-all cursor-pointer hover:bg-white/10 ${
              selectedTemplate?.id === template.id
                ? 'border-purple-500 ring-2 ring-purple-500/20'
                : 'border-white/10'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-purple-400" />
                  <h4 className="font-medium text-white">{template.name}</h4>
                </div>
                {provider === 'ses' && uploadedTemplates.has(template.id) && (
                  <CheckCircleIcon className="h-5 w-5 text-green-400" title="Uploaded to SES" />
                )}
              </div>
              <p className="text-sm text-white/60 mb-3">{template.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70">
                  {template.category}
                </span>
                <span className="text-xs text-white/50">
                  {template.variables.length} variables
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{selectedTemplate.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
                Preview
              </button>
              {provider === 'ses' && isConfigured && (
                <button
                  onClick={() => handleUploadToSES(selectedTemplate)}
                  disabled={uploading === selectedTemplate.id}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploading === selectedTemplate.id ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : uploadedTemplates.has(selectedTemplate.id) ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <ArrowUpTrayIcon className="h-5 w-5" />
                  )}
                  {uploadedTemplates.has(selectedTemplate.id) ? 'Re-upload' : 'Upload to SES'}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/60 mb-2">Subject Line:</p>
              <code className="block p-3 bg-black/30 rounded-lg text-white/90 text-sm">
                {selectedTemplate.subject}
              </code>
            </div>

            <div>
              <p className="text-sm text-white/60 mb-2">Variables:</p>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.variables.map(variable => (
                  <span
                    key={variable}
                    className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm text-white"
                  >
                    {variable}
                  </span>
                ))}
              </div>
            </div>

            {provider !== 'ses' && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-3">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-white/80">
                    <p className="font-medium mb-1">Template Upload Not Available</p>
                    <p className="text-white/60">
                      Template upload to email service is only available when using AWS SES as your email provider.
                      You can still preview and use templates with other providers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Template Preview: {selectedTemplate.name}</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircleIcon className="h-5 w-5 text-white/60" />
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPreviewMode('html')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewMode === 'html'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  HTML Preview
                </button>
                <button
                  onClick={() => setPreviewMode('text')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    previewMode === 'text'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  Text Preview
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {/* Variable Inputs */}
              <div className="mb-4 p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-white/60 mb-3">Template Variables:</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTemplate.variables.map(variable => (
                    <div key={variable}>
                      <label className="block text-xs text-white/60 mb-1">{variable}</label>
                      <input
                        type="text"
                        value={previewData[variable] || ''}
                        onChange={(e) => setPreviewData({ ...previewData, [variable]: e.target.value })}
                        className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Preview */}
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-white/60 mb-2">Subject:</p>
                <p className="text-white mb-4 font-medium">{getProcessedTemplate().subject}</p>

                {previewMode === 'html' ? (
                  <div className="bg-white rounded-lg p-4">
                    <iframe
                      srcDoc={getProcessedTemplate().html}
                      className="w-full h-96 border-0"
                      title="Email Preview"
                    />
                  </div>
                ) : (
                  <pre className="bg-black/30 rounded-lg p-4 text-white/90 text-sm whitespace-pre-wrap">
                    {getProcessedTemplate().text}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}