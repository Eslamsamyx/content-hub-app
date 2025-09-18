'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowDownTrayIcon,
  LockClosedIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface SharedAsset {
  id: string
  title: string
  description?: string
  type: string
  fileSize: string
  thumbnailUrl?: string
  previewUrl?: string
  downloadUrl?: string
  uploadedBy?: {
    firstName?: string
    lastName?: string
  }
  uploadedAt: string
  shareSettings: {
    allowDownload: boolean
    expiresAt?: string
    sharedBy: string
    sharedAt: string
  }
}

export default function SharePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const lng = params.lng as string || 'en'
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [asset, setAsset] = useState<SharedAsset | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (token) {
      fetchSharedAsset()
    }
  }, [token])

  const fetchSharedAsset = async (providedPassword?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      // If password is provided, send it for verification
      if (providedPassword) {
        const verifyResponse = await fetch(`/api/share/${token}/verify`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ password: providedPassword })
        })
        
        if (!verifyResponse.ok) {
          const data = await verifyResponse.json()
          // Extract the message from the error object structure
          const errorMessage = data.error?.message || data.error || 'Invalid password'
          throw new Error(errorMessage)
        }
      }
      
      // Fetch the shared asset
      const response = await fetch(`/api/share/${token}`)
      
      if (!response.ok) {
        const data = await response.json()
        // Extract the message from the error object structure
        const errorMessage = data.error?.message || data.error || 'Failed to load shared asset'
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (data.data.requiresPassword && !providedPassword) {
        setRequiresPassword(true)
      } else {
        setAsset(data.data.asset)
        setShareSettings(data.data.shareSettings)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shared asset')
    } finally {
      setLoading(false)
    }
  }

  const [shareSettings, setShareSettings] = useState<any>(null)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    
    setVerifying(true)
    try {
      await fetchSharedAsset(password)
      setRequiresPassword(false)
    } catch (err) {
      // Error is handled in fetchSharedAsset
    } finally {
      setVerifying(false)
    }
  }

  const handleDownload = async () => {
    if (!asset || !shareSettings?.allowDownload) return
    
    setDownloading(true)
    try {
      const response = await fetch(`/api/share/${token}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: requiresPassword ? password : undefined })
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const data = await response.json()
      
      // Open download URL in new tab
      if (data.data?.downloadUrl) {
        window.open(data.data.downloadUrl, '_blank')
      }
    } catch (err) {
      setError('Failed to download file')
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes)
    if (size === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <LockClosedIcon className="mx-auto h-16 w-16 text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              This shared asset is password protected
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
                required
                autoFocus
              />
            </div>
            
            <button
              type="submit"
              disabled={verifying || !password}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Access Asset'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!asset) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Preview Section */}
          <div className="relative h-96 bg-gray-100 dark:bg-gray-900">
            {asset.previewUrl || asset.thumbnailUrl ? (
              <Image
                src={asset.previewUrl || asset.thumbnailUrl || ''}
                alt={asset.title}
                fill
                className="object-contain"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ExclamationCircleIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No preview available</p>
                </div>
              </div>
            )}
          </div>

          {/* Asset Information */}
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {asset.title}
                </h1>
                {asset.description && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {asset.description}
                  </p>
                )}
              </div>
              
              {shareSettings?.allowDownload && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  {downloading ? 'Downloading...' : 'Download'}
                </button>
              )}
            </div>

            {/* Asset Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">File Type</p>
                <p className="text-gray-900 dark:text-white font-medium capitalize">
                  {asset.type}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">File Size</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatFileSize(asset.fileSize)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded</p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {formatDate(asset.uploadedAt)}
                </p>
              </div>
              
              {asset.uploadedBy && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded By</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {asset.uploadedBy.firstName} {asset.uploadedBy.lastName}
                  </p>
                </div>
              )}
              
              {shareSettings && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Shared By</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {shareSettings.sharedBy}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Shared On</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {formatDate(shareSettings.sharedAt)}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Expiration Warning */}
            {shareSettings?.expiresAt && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This share link expires on {formatDate(shareSettings.expiresAt)}
                </p>
              </div>
            )}

            {/* Download Not Allowed Message */}
            {!shareSettings?.allowDownload && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  This asset is view-only. Downloads are not permitted.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Powered by Content Hub</p>
        </div>
      </div>
    </div>
  )
}