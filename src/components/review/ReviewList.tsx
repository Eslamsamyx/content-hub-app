'use client'

import ClientImage from '@/components/common/ClientImage'
import {
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface ReviewListProps {
  reviews: any[]
  loading: boolean
  selectedReviewId: string | null
  onSelectReview: (id: string) => void
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ReviewList({ reviews, loading, selectedReviewId, onSelectReview, lng }: ReviewListProps) {
  const formatDate = (date: string) => {
    const now = new Date()
    const reviewDate = new Date(date)
    const diffMs = now.getTime() - reviewDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) {
      return `${diffMins} minutes ago`
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffMins / 1440)
      return `${days} day${days > 1 ? 's' : ''} ago`
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse mb-4">
            <div className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {reviews.map((review) => {
        const Icon = typeIcons[review.asset.type] || DocumentIcon
        const iconColor = typeColors[review.asset.type] || 'text-gray-600'
        const isSelected = selectedReviewId === review.id

        return (
          <button
            key={review.id}
            onClick={() => onSelectReview(review.id)}
            className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {review.asset.thumbnailUrl ? (
                  <ClientImage
                    src={review.asset.thumbnailUrl}
                    alt={review.asset.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className={`h-8 w-8 ${iconColor}`} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {review.asset.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Icon className={`h-3 w-3 mr-1 ${iconColor}`} />
                        {review.asset.type}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {review.asset.uploadedBy?.name || review.asset.uploadedBy?.email || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <ClockIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(review.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="ml-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      review.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                </div>
                {review.priority && (
                  <div className="mt-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      review.priority === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : review.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {review.priority} priority
                    </span>
                  </div>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}