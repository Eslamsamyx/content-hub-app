'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ClientImage from '@/components/common/ClientImage'
import VideoPreview from '@/components/previews/VideoPreview'
import ImagePreview from '@/components/previews/ImagePreview'
import AudioPreview from '@/components/previews/AudioPreview'
import DownloadHistory from '@/components/DownloadHistory'
import ShareAssetModal from './ShareAssetModal'
import {
  ArrowDownTrayIcon,
  ShareIcon,
  HeartIcon,
  FolderIcon,
  ChevronLeftIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { 
  useAssetDetail, 
  useDownloadAsset, 
  useSubmitForReview,
  useTrackAssetView,
  useAddToCollection,
  useCollections
} from '@/hooks/use-api'

// Dynamically import components
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

interface AssetDetailContentConnectedProps {
  assetId: string
  lng: string
}

export default function AssetDetailContentConnected({ assetId, lng }: AssetDetailContentConnectedProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [showDownloadHistory, setShowDownloadHistory] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')

  // API hooks
  const { data: asset, loading, error } = useAssetDetail(assetId)
  const { mutate: downloadAsset } = useDownloadAsset()
  const { mutate: submitForReview } = useSubmitForReview()
  const { mutate: trackView } = useTrackAssetView()
  const { mutate: addToCollection } = useAddToCollection()
  const { data: collectionsData } = useCollections({ limit: 50 })

  // Track whether we've already tracked a view for this asset
  const viewTrackedRef = useRef<string | null>(null)

  // Track view on mount - only once when asset loads
  useEffect(() => {
    if (asset && asset.id && viewTrackedRef.current !== asset.id) {
      console.log('🔍 Tracking view for asset:', asset.id)
      trackView(assetId)
      viewTrackedRef.current = asset.id
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset?.id, assetId, trackView])

  const handleDownload = async () => {
    try {
      const result = await downloadAsset(assetId)
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Failed to download asset:', error)
    }
  }

  const handleSubmitForReview = async () => {
    try {
      await submitForReview(assetId)
      setShowReviewModal(false)
      setReviewNotes('')
      // Refresh asset data to update status
      window.location.reload()
    } catch (error) {
      console.error('Failed to submit for review:', error)
    }
  }

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await addToCollection({ collectionId, assetIds: [assetId] })
      setShowCollectionModal(false)
    } catch (error) {
      console.error('Failed to add to collection:', error)
    }
  }

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Asset not found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          The asset you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <button
          onClick={() => router.push(`/${lng}/library`)}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
        >
          <ChevronLeftIcon className="h-4 w-4 mr-2" />
          Back to Library
        </button>
      </div>
    )
  }

  const canSubmitForReview = session?.user?.id === asset.userId && 
    asset.processingStatus === 'COMPLETED' && 
    !asset.readyForPublishing

  const isUnderReview = asset.processingStatus === 'REVIEWING'

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm mb-6 flex-wrap">
          <Link href={`/${lng}`} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Home
          </Link>
          <span className="text-gray-400">/</span>
          <Link href={`/${lng}/library`} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Library
          </Link>
          {asset.department && (
            <>
              <span className="text-gray-400">/</span>
              <Link 
                href={`/${lng}/library?department=${encodeURIComponent(asset.department)}`} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {asset.department}
              </Link>
            </>
          )}
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white">{asset.title}</span>
        </nav>

        {/* Asset Title with Status Badges */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{asset.title}</h1>
          {asset.readyForPublishing && (
            <span className="px-4 py-2 rounded-full text-sm font-medium glass backdrop-blur-md flex items-center gap-2 border border-green-400/50 bg-green-500/20 text-green-600 dark:text-green-400">
              <CheckCircleIcon className="w-5 h-5" />
              Ready for Publishing
            </span>
          )}
          {isUnderReview && (
            <span className="px-4 py-2 rounded-full text-sm font-medium glass backdrop-blur-md flex items-center gap-2 border border-yellow-400/50 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
              <ClockIcon className="w-5 h-5" />
              Under Review
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Type-specific Preview */}
            {asset.type === 'VIDEO' && (
              <VideoPreview 
                fileUrl={asset.previewUrl || asset.fileUrl}
                thumbnail={asset.thumbnailUrl || ''}
                title={asset.title}
              />
            )}
            {asset.type === 'IMAGE' && (
              <ImagePreview 
                fileUrl={asset.previewUrl || asset.fileUrl}
                title={asset.title}
                dimensions={asset.width && asset.height ? `${asset.width}x${asset.height}` : ''}
              />
            )}
            {asset.type === 'MODEL_3D' && (
              <ThreeDPreview 
                fileUrl={asset.fileUrl}
                thumbnail={asset.thumbnailUrl}
                title={asset.title}
              />
            )}
            {asset.type === 'DOCUMENT' && (
              <DocumentPreview 
                fileUrl={asset.previewUrl || asset.fileUrl}
                title={asset.title}
                format={asset.mimeType?.split('/')[1] || 'PDF'}
              />
            )}
            {asset.type === 'AUDIO' && (
              <AudioPreview 
                fileUrl={asset.previewUrl || asset.fileUrl}
                thumbnail={asset.thumbnailUrl || ''}
                title={asset.title}
              />
            )}
            {asset.type === 'DESIGN' && (
              <TwoDAssetsPreview 
                fileUrl={asset.previewUrl || asset.fileUrl}
                title={asset.title}
                dimensions={asset.width && asset.height ? `${asset.width}x${asset.height}` : ''}
                format={asset.mimeType?.split('/')[1] || ''}
              />
            )}

            {/* Description and Tags */}
            <div className="glass rounded-xl p-6 mt-6">
              {asset.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">{asset.description}</p>
                </div>
              )}
              
              {asset.tags && asset.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {asset.tags.map((tag: any) => (
                      <Link
                        key={tag.id}
                        href={`/${lng}/library?tag=${encodeURIComponent(tag.name)}`}
                        className="px-3 py-1 rounded-full text-sm glass backdrop-blur-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <TagIcon className="inline w-3 h-3 mr-1" />
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="glass rounded-xl p-6">
              <div className="space-y-3">
                <button 
                  onClick={handleDownload}
                  className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Download Asset
                </button>
                
                {canSubmitForReview && (
                  <button 
                    onClick={() => setShowReviewModal(true)}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ClipboardDocumentCheckIcon className="w-5 h-5" />
                    Submit for Review
                  </button>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="glass backdrop-blur-md px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
                  <button 
                    onClick={() => setShowCollectionModal(true)}
                    className="glass backdrop-blur-md px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span className="text-sm">Save</span>
                  </button>
                  <button 
                    onClick={() => setIsLiked(!isLiked)}
                    className="glass backdrop-blur-md px-3 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {isLiked ? (
                      <HeartSolidIcon className="w-4 h-4 text-red-500" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm">Like</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="glass rounded-xl p-6">
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
                {asset.duration && (
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Duration</dt>
                    <dd className="text-sm font-medium">
                      {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                    </dd>
                  </div>
                )}
                {asset.productionYear && (
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Year</dt>
                    <dd className="text-sm font-medium">{asset.productionYear}</dd>
                  </div>
                )}
                {asset.usage && (
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Usage</dt>
                    <dd className="text-sm font-medium">{asset.usage}</dd>
                  </div>
                )}
                {asset.company && (
                  <div>
                    <dt className="text-sm text-gray-500 dark:text-gray-400">Company</dt>
                    <dd className="text-sm font-medium">{asset.company}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Upload Date
                  </dt>
                  <dd className="text-sm font-medium">{formatDate(asset.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    Uploaded By
                  </dt>
                  <dd className="text-sm font-medium">
                    {asset.uploadedBy ? `${asset.uploadedBy.firstName} ${asset.uploadedBy.lastName}`.trim() || asset.uploadedBy.email : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <EyeIcon className="w-4 h-4 mr-1" />
                    Views
                  </dt>
                  <dd className="text-sm font-medium">{asset.viewCount || 0}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Downloads
                  </dt>
                  <dd className="text-sm font-medium flex items-center justify-between">
                    <span>{asset.downloadCount || 0}</span>
                    <button 
                      onClick={() => setShowDownloadHistory(!showDownloadHistory)}
                      className="text-xs text-primary hover:text-primary-dark"
                    >
                      View History
                    </button>
                  </dd>
                </div>
              </dl>
            </div>

            {/* Related Assets */}
            {asset.relatedAssets && asset.relatedAssets.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Related Assets</h3>
                <div className="grid grid-cols-3 gap-2">
                  {asset.relatedAssets.map((related: any) => (
                    <Link 
                      key={related.id} 
                      href={`/${lng}/asset/${related.id}`}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-80 transition-opacity"
                    >
                      {related.thumbnailUrl ? (
                        <ClientImage 
                          src={related.thumbnailUrl} 
                          alt={related.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PaperClipIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Download History */}
        {showDownloadHistory && (
          <DownloadHistory 
            assetId={assetId}
            assetTitle={asset?.title || ''}
            isOpen={showDownloadHistory}
            onClose={() => setShowDownloadHistory(false)}
          />
        )}
      </div>

      {/* Submit for Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Submit for Review
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Submit this asset for review and approval. Once approved, it will be marked as ready for publishing.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes for reviewer (optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                placeholder="Any specific instructions or context..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setReviewNotes('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitForReview}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Add to Collection
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {collectionsData?.collections && collectionsData.collections.length > 0 ? (
                collectionsData.collections.map((collection: any) => (
                  <button
                    key={collection.id}
                    onClick={() => handleAddToCollection(collection.id)}
                    className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <FolderIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{collection.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {collection.assetCount || 0} items
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No collections yet. Create one first!
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowCollectionModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareAssetModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        assetId={asset.id}
        assetTitle={asset.title}
        currentShareLink={asset.shareLink}
        lng={lng}
      />
    </>
  )
}