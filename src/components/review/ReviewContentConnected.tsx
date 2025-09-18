'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { usePendingReviews } from '@/hooks/use-api'
import ReviewList from './ReviewList'
import ReviewDetail from './ReviewDetail'

interface ReviewContentConnectedProps {
  lng: string
}

export default function ReviewContentConnected({ lng }: ReviewContentConnectedProps) {
  const { data: session } = useSession()
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_progress'>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Check if user has review permissions
  const canReview = session?.user?.role && ['REVIEWER', 'CONTENT_MANAGER', 'ADMIN'].includes(session.user.role)

  // Fetch pending reviews
  const { data: reviewsData, loading, refetch } = usePendingReviews({
    page: currentPage,
    limit: 10
  })

  const reviews = reviewsData?.reviews || []
  const totalPages = Math.ceil((reviewsData?.total || 0) / 10)

  const stats = {
    pending: reviewsData?.stats?.pending || 0,
    inProgress: reviewsData?.stats?.inProgress || 0,
    completed: reviewsData?.stats?.completedToday || 0,
    avgTime: reviewsData?.stats?.avgReviewTime || '0h'
  }

  const handleReviewComplete = () => {
    setSelectedReviewId(null)
    refetch()
  }

  if (!canReview) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ClipboardDocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don&apos;t have permission to access the review workflow.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <ClipboardDocumentCheckIcon className="h-8 w-8 mr-3" />
              Review Workflow
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Review and approve content submissions
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Logged in as</p>
            <p className="font-medium text-gray-900 dark:text-white">{session?.user?.name || session?.user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.role}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Pending Reviews
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.pending}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    In Progress
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.inProgress}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Completed Today
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.completed}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Avg Review Time
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stats.avgTime}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Review List */}
        <div className={`${selectedReviewId ? 'w-1/3' : 'w-full'} transition-all duration-300`}>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Review Queue</h2>
                <div className="flex items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                  </select>
                </div>
              </div>
              
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Review List */}
            <ReviewList
              reviews={reviews}
              loading={loading}
              selectedReviewId={selectedReviewId}
              onSelectReview={setSelectedReviewId}
              lng={lng}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Detail */}
        {selectedReviewId && (
          <div className="flex-1 transition-all duration-300">
            <ReviewDetail
              reviewId={selectedReviewId}
              onClose={() => setSelectedReviewId(null)}
              onComplete={handleReviewComplete}
              lng={lng}
            />
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No reviews pending</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            All assets have been reviewed. Great job!
          </p>
        </div>
      )}
    </div>
  )
}