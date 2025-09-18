'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDownTrayIcon, ChevronLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

interface Asset {
  id: string
  title: string
  description?: string
  type: string
  fileSize: number
  thumbnailUrl?: string
  fileUrl: string
  createdAt: string
  uploadedBy?: {
    firstName?: string
    lastName?: string
    email: string
  }
  width?: number
  height?: number
  mimeType?: string
  downloadCount?: number
  viewCount?: number
}

interface AssetDetailContentSimpleProps {
  assetId: string
  lng: string
}

export default function AssetDetailContentSimple({ assetId, lng }: AssetDetailContentSimpleProps) {
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const response = await fetch(`/api/assets/${assetId}`)
        if (!response.ok) {
          throw new Error('Asset not found')
        }
        const data = await response.json()
        setAsset(data.asset)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load asset')
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [assetId])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDownload = () => {
    if (asset?.fileUrl) {
      window.open(asset.fileUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Asset not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The asset you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <button
          onClick={() => router.push(`/${lng}/explore`)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Back to Explore
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm mb-6">
        <Link href={`/${lng}`} className="text-gray-500 hover:text-gray-700">
          Home
        </Link>
        <span className="text-gray-400">/</span>
        <Link href={`/${lng}/explore`} className="text-gray-500 hover:text-gray-700">
          Explore
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 dark:text-white">{asset.title}</span>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{asset.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Simple Preview */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
            {asset.thumbnailUrl ? (
              <img
                src={asset.thumbnailUrl}
                alt={asset.title}
                className="w-full max-h-96 object-contain rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">{asset.type} Preview</span>
              </div>
            )}
          </div>

          {/* Description */}
          {asset.description && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-6 shadow">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400">{asset.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Download Button */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Download Asset
            </button>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
            <h3 className="text-lg font-semibold mb-4">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Format</dt>
                <dd className="text-sm font-medium">{asset.type}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">File Size</dt>
                <dd className="text-sm font-medium">{formatFileSize(asset.fileSize)}</dd>
              </div>
              {asset.width && asset.height && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Dimensions</dt>
                  <dd className="text-sm font-medium">{asset.width} × {asset.height}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Upload Date</dt>
                <dd className="text-sm font-medium">{formatDate(asset.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Uploaded By</dt>
                <dd className="text-sm font-medium">
                  {asset.uploadedBy ?
                    `${asset.uploadedBy.firstName || ''} ${asset.uploadedBy.lastName || ''}`.trim() || asset.uploadedBy.email
                    : 'Unknown'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Views</dt>
                <dd className="text-sm font-medium">{asset.viewCount || 0}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Downloads</dt>
                <dd className="text-sm font-medium">{asset.downloadCount || 0}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}