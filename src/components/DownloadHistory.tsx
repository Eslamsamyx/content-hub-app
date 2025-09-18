'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Download {
  id: string
  userName: string
  userEmail: string
  userType: 'internal' | 'visitor'
  downloadDate: string
  department?: string
  company?: string
  avatar?: string
}

interface DownloadHistoryProps {
  assetId: string
  assetTitle: string
  isOpen: boolean
  onClose: () => void
}

export default function DownloadHistory({ assetId, assetTitle, isOpen, onClose }: DownloadHistoryProps) {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [filter, setFilter] = useState<'all' | 'internal' | 'visitor'>('all')

  useEffect(() => {
    if (isOpen) {
      // Mock data - in real app, fetch from API
      const mockDownloads: Download[] = [
        {
          id: '1',
          userName: 'Sarah Johnson',
          userEmail: 'sarah.johnson@company.com',
          userType: 'internal',
          downloadDate: '2024-01-20 14:30',
          department: 'Marketing',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        {
          id: '2',
          userName: 'Ahmed Al-Rahman',
          userEmail: 'ahmed@partner.com',
          userType: 'visitor',
          downloadDate: '2024-01-19 10:15',
          company: 'Partner Corp',
          avatar: 'https://i.pravatar.cc/150?img=2'
        },
        {
          id: '3',
          userName: 'Emily Chen',
          userEmail: 'emily.chen@company.com',
          userType: 'internal',
          downloadDate: '2024-01-18 16:45',
          department: 'Design',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        {
          id: '4',
          userName: 'Guest User',
          userEmail: 'visitor@external.com',
          userType: 'visitor',
          downloadDate: '2024-01-18 09:20',
          avatar: 'https://i.pravatar.cc/150?img=4'
        },
        {
          id: '5',
          userName: 'Michael Brown',
          userEmail: 'michael.brown@company.com',
          userType: 'internal',
          downloadDate: '2024-01-17 13:10',
          department: 'Sales',
          avatar: 'https://i.pravatar.cc/150?img=5'
        }
      ]
      setDownloads(mockDownloads)
    }
  }, [isOpen, assetId])

  const filteredDownloads = downloads.filter(download => {
    if (filter === 'all') return true
    return download.userType === filter
  })

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Download History</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {assetTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All ({downloads.length})
              </button>
              <button
                onClick={() => setFilter('internal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'internal' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Internal ({downloads.filter(d => d.userType === 'internal').length})
              </button>
              <button
                onClick={() => setFilter('visitor')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'visitor' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Visitors ({downloads.filter(d => d.userType === 'visitor').length})
              </button>
            </div>
          </div>
          
          {/* Download List */}
          <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
            {filteredDownloads.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No downloads found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredDownloads.map((download) => (
                  <div key={download.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {download.avatar ? (
                          <Image
                            src={download.avatar}
                            alt={download.userName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {download.userName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {download.userEmail}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                download.userType === 'internal' 
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {download.userType === 'internal' ? 'Internal' : 'Visitor'}
                              </span>
                              {download.department && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {download.department}
                                </span>
                              )}
                              {download.company && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {download.company}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {download.downloadDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total downloads: {downloads.length}
              </span>
              <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium">
                Export as CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}