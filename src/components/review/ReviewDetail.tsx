'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import Link from 'next/link'
import {
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { useReviewDetail, useApproveAsset, useRejectAsset, useRequestChanges } from '@/hooks/use-api'
import { useToast } from '@/contexts/ToastContext'

interface ReviewDetailProps {
  reviewId: string
  onClose: () => void
  onComplete: () => void
  lng: string
}

const typeIcons: Record<string, any> = {
  IMAGE: PhotoIcon,
  VIDEO: VideoCameraIcon,
  DOCUMENT: DocumentIcon,
  AUDIO: MusicalNoteIcon,
  MODEL_3D: CubeIcon,
  DESIGN: PaintBrushIcon
}

const rejectionReasons = [
  'Poor quality',
  'Inappropriate content',
  'Copyright violation',
  'Wrong category',
  'Missing metadata',
  'Technical issues',
  'Duplicate content',
  'Other'
]

const changeRequestTypes = [
  'Update title',
  'Update description',
  'Add tags',
  'Change category',
  'Improve quality',
  'Fix metadata',
  'Replace file',
  'Other'
]

export default function ReviewDetail({ reviewId, onClose, onComplete, lng }: ReviewDetailProps) {
  const { showSuccess, showError, showWarning } = useToast()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [selectedReasons, setSelectedReasons] = useState<string[]>([])
  const [comments, setComments] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const { data: review, loading, error } = useReviewDetail(reviewId)
  const { mutate: approveAsset } = useApproveAsset()
  const { mutate: rejectAsset } = useRejectAsset()
  const { mutate: requestChanges } = useRequestChanges()

  const asset = review?.asset

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await approveAsset(reviewId)
      showSuccess('Asset Approved', 'The asset has been approved and is now available.')
      onComplete()
    } catch (error) {
      console.error('Failed to approve asset:', error)
      showError('Approval Failed', 'Failed to approve the asset. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (selectedReasons.length === 0) {
      showWarning('Selection Required', 'Please select at least one reason for rejection.')
      return
    }

    setActionLoading(true)
    try {
      await rejectAsset({
        reviewId,
        reasons: selectedReasons,
        comments
      })
      showSuccess('Asset Rejected', 'The asset has been rejected and the uploader will be notified.')
      setShowRejectModal(false)
      onComplete()
    } catch (error) {
      console.error('Failed to reject asset:', error)
      showError('Rejection Failed', 'Failed to reject the asset. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (selectedReasons.length === 0) {
      showWarning('Selection Required', 'Please select at least one type of change to request.')
      return
    }

    setActionLoading(true)
    try {
      await requestChanges({
        id: reviewId,
        requiredChanges: selectedReasons,
        comments
      })
      showSuccess('Changes Requested', 'The uploader has been notified of the requested changes.')
      setShowChangesModal(false)
      onComplete()
    } catch (error) {
      console.error('Failed to request changes:', error)
      showError('Request Failed', 'Failed to request changes. Please try again.')
    } finally {
      setActionLoading(false)
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Error loading review</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Unable to load review details. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const Icon = typeIcons[asset.type] || DocumentIcon

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Review Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Asset Preview */}
          <div className="mb-6">
            <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg">
              {asset.previewUrl || asset.thumbnailUrl ? (
                <ClientImage
                  src={asset.previewUrl || asset.thumbnailUrl}
                  alt={asset.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Asset Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {asset.title}
              </h3>
              {asset.description && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {asset.description}
                </p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                  <Icon className="h-4 w-4 mr-1" />
                  {asset.type}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">File Size</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatFileSize(asset.fileSize)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Uploaded By</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  {asset.uploadedBy?.name || asset.uploadedBy?.email || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload Date</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(asset.createdAt)}
                </p>
              </div>
              {asset.department && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Department</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {asset.department}
                  </p>
                </div>
              )}
              {asset.usage && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usage</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    {asset.usage}
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {asset.tags && asset.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            {(asset.width || asset.duration) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Technical Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {asset.width && asset.height && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Dimensions:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {asset.width} × {asset.height}
                      </span>
                    </div>
                  )}
                  {asset.duration && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {Math.floor(asset.duration / 60)}:{(asset.duration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {asset.mimeType && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">MIME Type:</span>
                      <span className="ml-1 text-gray-900 dark:text-white">
                        {asset.mimeType}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Review Information</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Submitted for review:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(review.submittedAt)}
                  </span>
                </div>
                {review.notes && (
                  <div className="mt-2">
                    <span className="text-gray-500 dark:text-gray-400">Notes:</span>
                    <p className="mt-1 text-gray-900 dark:text-white">{review.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link
                href={`/${lng}/asset/${asset.id}`}
                target="_blank"
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <EyeIcon className="h-4 w-4 mr-2" />
                View Full Details
              </Link>
              {asset.downloadUrl && (
                <a
                  href={asset.downloadUrl}
                  download
                  className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download Original
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Make your decision for this asset
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChangesModal(true)}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 border border-yellow-300 rounded-md text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 disabled:opacity-50"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Request Changes
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Reject
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Reject Asset
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reasons for rejection
                </label>
                <div className="space-y-2">
                  {rejectionReasons.map((reason) => (
                    <label key={reason} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(reason)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReasons([...selectedReasons, reason])
                          } else {
                            setSelectedReasons(selectedReasons.filter(r => r !== reason))
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Provide specific feedback..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedReasons([])
                  setComments('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || selectedReasons.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject Asset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Request Changes
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required changes
                </label>
                <div className="space-y-2">
                  {changeRequestTypes.map((change) => (
                    <label key={change} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedReasons.includes(change)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReasons([...selectedReasons, change])
                          } else {
                            setSelectedReasons(selectedReasons.filter(r => r !== change))
                          }
                        }}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-white">{change}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Detailed instructions
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  placeholder="Explain what needs to be changed..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowChangesModal(false)
                  setSelectedReasons([])
                  setComments('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestChanges}
                disabled={actionLoading || selectedReasons.length === 0}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                Request Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}