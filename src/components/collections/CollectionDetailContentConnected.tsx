'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import ClientImage from '@/components/common/ClientImage'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ShareIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'
import { useCollection, useCollectionAssets, useRemoveFromCollection } from '@/hooks/use-api'
import { useToast } from '@/contexts/ToastContext'

interface CollectionDetailContentConnectedProps {
  lng: string
  collectionId: string
}

export default function CollectionDetailContentConnected({ 
  lng, 
  collectionId 
}: CollectionDetailContentConnectedProps) {
  const { data: session } = useSession()
  const { showSuccess, showError, showInfo, showWarning } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewType, setViewType] = useState('grid')
  const [filterType] = useState('all')
  const [sortBy] = useState('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [assetToRemove, setAssetToRemove] = useState<any>(null)

  // Fetch collection details
  const { data: collection, loading: collectionLoading, error: collectionError } = useCollection(collectionId)
  
  // Fetch collection assets - only if we don't have them from the collection response
  const { 
    data: assetsData, 
    loading: assetsLoading, 
    refetch: refetchAssets 
  } = useCollectionAssets(collectionId, {
    search: searchQuery || undefined,
    type: filterType !== 'all' ? filterType : undefined,
    sortBy,
    sortOrder: sortBy === 'recent' ? 'desc' : 'asc'
  })

  const { mutate: removeFromCollection } = useRemoveFromCollection()

  // Use assets from collection data if available, otherwise from separate endpoint
  const assets = collection?.assets || assetsData || []
  const isOwner = collection && session?.user?.id === collection.createdBy?.id

  const confirmRemoveAsset = (asset: any) => {
    if (!isOwner) return
    setAssetToRemove(asset)
    setShowRemoveModal(true)
  }

  const handleRemoveAsset = async () => {
    if (!assetToRemove) return
    
    try {
      await removeFromCollection({
        collectionId,
        assetId: assetToRemove.id
      })
      showSuccess('Asset Removed', `${assetToRemove.title} has been removed from the collection.`)
      setShowRemoveModal(false)
      setAssetToRemove(null)
      refetchAssets()
    } catch (error) {
      console.error('Failed to remove asset:', error)
      showError('Removal Failed', 'Failed to remove asset from collection. Please try again.')
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${lng}/collections/${collectionId}`
    navigator.clipboard.writeText(shareUrl)
    setIsCopied(true)
    showSuccess('Link Copied', 'Collection link has been copied to clipboard.')
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleDownloadAll = async () => {
    if (assets.length === 0) {
      showInfo('No Assets', 'There are no assets to download in this collection.')
      return
    }

    // Import batch download utilities dynamically
    const { downloadAssetsAsZip, formatBytes, calculateTotalSize } = await import('@/lib/batch-download')
    
    // Prepare assets for download
    const downloadableAssets = assets.map((asset: any) => ({
      id: asset.id,
      title: asset.title,
      url: asset.url,
      type: asset.type,
      fileSize: asset.fileSize
    }))

    // Calculate total size
    const totalSize = calculateTotalSize(downloadableAssets)
    
    // Show warning for large files
    if (totalSize > 100 * 1024 * 1024) { // 100MB
      showWarning('Large Download', `Downloading ${formatBytes(totalSize)} of data. This may take a while.`)
    }

    try {
      // Show progress (could be enhanced with a proper progress modal)
      const progressElement = document.createElement('div')
      progressElement.className = 'fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50'
      progressElement.innerHTML = '<div>Preparing download...</div><div class="text-sm text-gray-400">0%</div>'
      document.body.appendChild(progressElement)

      await downloadAssetsAsZip(
        downloadableAssets,
        `${collection.name.replace(/\s+/g, '_')}_assets.zip`,
        (progress) => {
          if (progress <= 100) {
            progressElement.innerHTML = `<div>Downloading assets...</div><div class="text-sm text-gray-400">${Math.round(progress)}%</div>`
          } else {
            progressElement.innerHTML = `<div>Creating ZIP file...</div><div class="text-sm text-gray-400">${Math.round(progress - 100)}%</div>`
          }
        }
      )

      // Remove progress element
      setTimeout(() => {
        document.body.removeChild(progressElement)
      }, 2000)
      
      showSuccess('Download Complete', `Successfully downloaded ${assets.length} assets.`)
    } catch (error) {
      console.error('Batch download failed:', error)
      showError('Download Failed', 'Failed to download assets. Please try again later.')
      
      // Remove progress element on error
      const progressEl = document.querySelector('.fixed.bottom-4.right-4')
      if (progressEl) {
        document.body.removeChild(progressEl)
      }
    }
  }

  const formatFileSize = (bytes: number | string) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
    const units = ['B', 'KB', 'MB', 'GB']
    let unitIndex = 0
    let formattedSize = size
    
    while (formattedSize >= 1024 && unitIndex < units.length - 1) {
      formattedSize /= 1024
      unitIndex++
    }
    
    return `${formattedSize.toFixed(1)} ${units[unitIndex]}`
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (collectionLoading || assetsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (collectionError || !collection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Collection Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The collection you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </p>
          <Link
            href={`/${lng}/collections`}
            className="mt-4 inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-2" />
            Back to Collections
          </Link>
        </div>
      </div>
    )
  }

  const filteredAssets = assets.filter((asset: any) => {
    if (searchQuery) {
      return asset.title.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const totalSize = assets.reduce((sum: number, asset: any) => sum + Number(asset.fileSize || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black">
      {/* Header */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
          {collection.thumbnailUrl && (
            <ClientImage
              src={collection.thumbnailUrl}
              alt={collection.name}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Back Button */}
          <Link
            href={`/${lng}/collections`}
            className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors"
          >
            <ChevronLeftIcon className="w-6 h-6 text-white" />
          </Link>

          {/* Collection Info */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-4xl font-bold text-white mb-2">{collection.name}</h1>
              <p className="text-white/90 max-w-2xl">{collection.description}</p>
              
              <div className="flex items-center gap-6 mt-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4" />
                  {collection.createdBy?.firstName} {collection.createdBy?.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  Created {formatDate(collection.createdAt)}
                </span>
                <span>{assets.length} assets</span>
                <span>{formatFileSize(totalSize)}</span>
                {collection.isPrivate && (
                  <span className="px-2 py-1 bg-white/20 rounded text-xs">Private</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {collection.tags?.map((tag: any) => (
                  <span
                    key={tag.id || tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
                  >
                    #{tag.name || tag}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                  {isCopied ? 'Copied!' : 'Share'}
                </button>
                
                <button
                  onClick={handleDownloadAll}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download All
                </button>
                
                {isOwner && (
                  <Link
                    href={`/${lng}/collections/${collectionId}/edit`}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Edit Collection
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search in collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <FunnelIcon className="w-5 h-5" />
            </button>
            
            <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => setViewType('grid')}
                className={`p-2 ${viewType === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewType('list')}
                className={`p-2 ${viewType === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <FolderIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No assets found' : 'No assets yet'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                  : 'This collection doesn\'t have any assets yet. Start adding content to organize your digital assets.'}
              </p>
              {isOwner && !searchQuery && (
                <Link
                  href={`/${lng}/explore`}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Browse Assets to Add
                </Link>
              )}
            </div>
          </div>
        ) : viewType === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets.map((asset: any) => (
              <div key={asset.id} className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <Link href={`/${lng}/asset/${asset.id}`}>
                  <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {asset.thumbnailUrl ? (
                      <ClientImage
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-4xl">📄</div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(asset.fileSize)} • {asset.type}
                  </p>
                  
                  {isOwner && (
                    <button
                      onClick={() => confirmRemoveAsset(asset)}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove from collection
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssets.map((asset: any) => (
              <div key={asset.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {asset.thumbnailUrl ? (
                      <ClientImage
                        src={asset.thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-2xl">📄</div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Link
                      href={`/${lng}/asset/${asset.id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-primary"
                    >
                      {asset.title}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(asset.fileSize)} • {asset.type} • {formatDate(asset.createdAt)}
                    </p>
                  </div>
                </div>
                
                {isOwner && (
                  <button
                    onClick={() => confirmRemoveAsset(asset)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Remove Asset Confirmation Modal */}
      {showRemoveModal && assetToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Remove Asset from Collection
                </h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to remove{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {assetToRemove.title}
                </span>{' '}
                from this collection?
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                The asset will remain in the system and can be added back to this collection later.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveModal(false)
                  setAssetToRemove(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveAsset}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                Remove Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}