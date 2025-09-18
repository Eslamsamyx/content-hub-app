'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { 
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAssets, useDeleteAsset } from '@/hooks/use-api'
import Link from 'next/link'
import { useToast } from '@/contexts/ToastContext'
import AdminCustomDropdown from './AdminCustomDropdown'

interface ContentManagementConnectedProps {
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

const typeColors: Record<string, string> = {
  IMAGE: 'text-blue-600',
  VIDEO: 'text-red-600',
  DOCUMENT: 'text-gray-600',
  AUDIO: 'text-yellow-600',
  MODEL_3D: 'text-purple-600',
  DESIGN: 'text-green-600'
}

export default function ContentManagementConnected({ lng }: ContentManagementConnectedProps) {
  const { showSuccess, showError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<any>(null)
  
  const { data: assetsData, loading, refetch } = useAssets({
    search: searchTerm || undefined,
    type: selectedType !== 'all' ? selectedType : undefined,
    page: currentPage,
    limit: 10
  })

  const { mutate: deleteAsset } = useDeleteAsset()

  const assets = assetsData?.assets || []
  const totalPages = Math.ceil((assetsData?.total || 0) / 10)

  const confirmDeleteAsset = (asset: any) => {
    setAssetToDelete(asset)
    setShowDeleteModal(true)
  }

  const handleDeleteAsset = async () => {
    if (!assetToDelete) return
    
    try {
      await deleteAsset(assetToDelete.id)
      showSuccess('Asset Deleted', `${assetToDelete.title} has been permanently deleted.`)
      setShowDeleteModal(false)
      setAssetToDelete(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete asset:', error)
      showError('Deletion Failed', 'Failed to delete the asset. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-all duration-200"
          />
        </div>
        <AdminCustomDropdown
          value={selectedType}
          onChange={setSelectedType}
          options={[
            { value: "all", label: "All Types" },
            { value: "IMAGE", label: "Images" },
            { value: "VIDEO", label: "Videos" },
            { value: "DOCUMENT", label: "Documents" },
            { value: "AUDIO", label: "Audio" },
            { value: "MODEL_3D", label: "3D Models" },
            { value: "DESIGN", label: "Designs" }
          ]}
          width="w-44"
          aria-label="Filter by content type"
        />
        <AdminCustomDropdown
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={[
            { value: "all", label: "All Status" },
            { value: "COMPLETED", label: "Completed" },
            { value: "PROCESSING", label: "Processing" },
            { value: "FAILED", label: "Failed" },
            { value: "REVIEWING", label: "Under Review" }
          ]}
          width="w-44"
          aria-label="Filter by status"
        />
      </div>

      {/* Content Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uploaded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stats
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {assets.map((asset: any) => {
              const Icon = typeIcons[asset.type] || DocumentIcon
              const iconColor = typeColors[asset.type] || 'text-gray-600'
              
              return (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {asset.thumbnailUrl ? (
                          <ClientImage 
                            className="h-10 w-10 rounded-lg object-cover" 
                            src={asset.thumbnailUrl} 
                            alt={asset.title} 
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Icon className={`h-6 w-6 ${iconColor}`} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {asset.title}
                        </div>
                        {asset.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {asset.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Icon className={`h-5 w-5 mr-2 ${iconColor}`} />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {asset.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatFileSize(asset.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      asset.processingStatus === 'COMPLETED'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : asset.processingStatus === 'PROCESSING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : asset.processingStatus === 'FAILED'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : asset.processingStatus === 'REVIEWING'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {asset.processingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {asset.uploadedBy?.name || asset.uploadedBy?.email || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(asset.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {asset.viewCount || 0}
                      </span>
                      <span className="flex items-center">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {asset.downloadCount || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/${lng}/asset/${asset.id}`}
                      className="text-primary hover:text-primary-dark mr-3"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => confirmDeleteAsset(asset)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 text-sm disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 text-sm disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && assetToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Asset
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {assetToDelete.title}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Type: <span className="font-medium">{assetToDelete.type}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Size: <span className="font-medium">{formatFileSize(assetToDelete.fileSize)}</span>
              </p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>This action cannot be undone. The asset will be permanently deleted from:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>All collections</li>
                      <li>User libraries</li>
                      <li>Storage system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setAssetToDelete(null)
                }}
                className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAsset}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}