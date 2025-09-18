'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ClientImage from '@/components/common/ClientImage'
import VideoPreview from '@/components/previews/VideoPreview'
import ImagePreview from '@/components/previews/ImagePreview'
import AudioPreview from '@/components/previews/AudioPreview'
import DownloadHistory from '@/components/DownloadHistory'

// Dynamically import components that use browser APIs to avoid SSR issues
const ThreeDPreview = dynamic(
  () => import('@/components/previews/ThreeDPreview'),
  { 
    ssr: false,
    loading: () => (
      <div className="glass rounded-xl p-6">
        <div className="aspect-video relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-gray-400">Loading 3D viewer...</div>
        </div>
      </div>
    )
  }
)

const DocumentPreview = dynamic(
  () => import('@/components/previews/DocumentPreview'),
  { 
    ssr: false,
    loading: () => (
      <div className="glass rounded-xl p-6">
        <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400">Loading document viewer...</div>
        </div>
      </div>
    )
  }
)

const TwoDAssetsPreview = dynamic(
  () => import('@/components/previews/TwoDAssetsPreview'),
  { 
    ssr: false,
    loading: () => (
      <div className="glass rounded-xl p-6">
        <div className="aspect-video relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-gray-400">Loading 2D viewer...</div>
        </div>
      </div>
    )
  }
)

interface RelatedAsset {
  id: string
  thumbnail: string
  title: string
}

interface AssetDetail {
  id: string
  title: string
  type: 'video' | 'image' | '3d' | 'document' | 'audio' | '2d'
  fileUrl: string
  thumbnail?: string
  description?: string
  tags: string[]
  format?: string
  fileSize: string
  dimensions?: string
  year?: string
  usage?: string
  company?: string
  uploadDate: string
  lastModified: string
  uploadedBy: string
  downloads: number
  relatedAssets: RelatedAsset[]
}

interface AssetDetailContentProps {
  asset: AssetDetail
  lng: string
  translations: {
    description: string
    tags: string
    details: string
    format: string
    fileSize: string
    dimensions: string
    year: string
    usage: string
    company: string
    uploadDate: string
    lastModified: string
    uploadedBy: string
    downloads: string
    downloadAsset: string
    shareAsset: string
    addToCollection: string
    favoriteAsset: string
    relatedAssets: string
  }
}

export default function AssetDetailContent({ asset, lng, translations }: AssetDetailContentProps) {
  const [showDownloadHistory, setShowDownloadHistory] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Type-specific Preview */}
          {asset.type === 'video' && (
            <VideoPreview 
              fileUrl={asset.fileUrl}
              thumbnail={asset.thumbnail || ''}
              title={asset.title}
            />
          )}
          {asset.type === 'image' && (
            <ImagePreview 
              fileUrl={asset.fileUrl}
              title={asset.title}
              dimensions={asset.dimensions || ''}
            />
          )}
          {asset.type === '3d' && (
            <ThreeDPreview 
              fileUrl={asset.fileUrl}
              thumbnail={asset.thumbnail}
              title={asset.title}
            />
          )}
          {asset.type === 'document' && (
            <DocumentPreview 
              fileUrl={asset.fileUrl}
              title={asset.title}
              format={asset.format || ''}
            />
          )}
          {asset.type === 'audio' && (
            <AudioPreview 
              fileUrl={asset.fileUrl}
              thumbnail={asset.thumbnail || ''}
              title={asset.title}
            />
          )}
          {asset.type === '2d' && (
            <TwoDAssetsPreview 
              fileUrl={asset.fileUrl}
              title={asset.title}
              dimensions={asset.dimensions || ''}
              format={asset.format || ''}
            />
          )}

          {/* Description */}
          <div className="glass rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{translations.description}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {asset.description}
            </p>
          </div>

          {/* Tags */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">{translations.tags}</h2>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/${lng}/explore?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 glass rounded-full text-sm hover:bg-white/10 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          {/* Download Button */}
          <button className="w-full py-3 px-4 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity font-medium mb-6">
            {translations.downloadAsset}
          </button>

          {/* Asset Details */}
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">{translations.details}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.format}
                </span>
                <span className="text-sm font-medium">{asset.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.fileSize}
                </span>
                <span className="text-sm font-medium">{asset.fileSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.dimensions}
                </span>
                <span className="text-sm font-medium">{asset.dimensions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.year}
                </span>
                <span className="text-sm font-medium">{asset.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Usage
                </span>
                <span className={`text-sm font-medium ${asset.usage === 'Public' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {asset.usage}
                </span>
              </div>
              {asset.company && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Client/Company
                  </span>
                  <span className="text-sm font-medium">{asset.company}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.uploadDate}
                </span>
                <span className="text-sm font-medium">{asset.uploadDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.lastModified}
                </span>
                <span className="text-sm font-medium">{asset.lastModified}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.uploadedBy}
                </span>
                <span className="text-sm font-medium">{asset.uploadedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {translations.downloads}
                </span>
                <button 
                  onClick={() => setShowDownloadHistory(true)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  {asset.downloads}
                </button>
              </div>
            </div>
          </div>

          {/* Related Assets */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-4">{translations.relatedAssets}</h3>
            <div className="space-y-3">
              {asset.relatedAssets.map((related) => (
                <Link
                  key={related.id}
                  href={`/${lng}/asset/${related.id}`}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <ClientImage
                      src={related.thumbnail}
                      alt={related.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium line-clamp-2">{related.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Download History Modal */}
      <DownloadHistory 
        assetId={asset.id}
        assetTitle={asset.title}
        isOpen={showDownloadHistory}
        onClose={() => setShowDownloadHistory(false)}
      />
    </>
  )
}