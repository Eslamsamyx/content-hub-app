'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { 
  ArrowUpTrayIcon, 
  DocumentIcon, 
  PhotoIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface UploadItem {
  id: string
  fileName: string
  fileType: 'image' | 'video' | 'audio' | 'document' | '3d'
  fileSize: string
  status: 'completed' | 'uploading' | 'failed' | 'processing'
  progress: number
  uploadedAt: string
  uploadedBy: string
  department: string
  thumbnail?: string
}

const mockUploadActivity: UploadItem[] = [
  {
    id: '1',
    fileName: 'Q4-Marketing-Campaign-Banner.psd',
    fileType: 'image',
    fileSize: '45.2 MB',
    status: 'completed',
    progress: 100,
    uploadedAt: '2024-01-26T10:30:00',
    uploadedBy: 'Sarah Johnson',
    department: 'Marketing',
    thumbnail: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    fileName: 'Product-Launch-Video-Final.mp4',
    fileType: 'video',
    fileSize: '256.8 MB',
    status: 'uploading',
    progress: 67,
    uploadedAt: '2024-01-26T10:25:00',
    uploadedBy: 'Mike Chen',
    department: 'Creative'
  },
  {
    id: '3',
    fileName: 'Annual-Report-2024.pdf',
    fileType: 'document',
    fileSize: '8.3 MB',
    status: 'processing',
    progress: 90,
    uploadedAt: '2024-01-26T10:20:00',
    uploadedBy: 'Emily Davis',
    department: 'Finance'
  },
  {
    id: '4',
    fileName: 'Booth-Design-3D-Model.glb',
    fileType: '3d',
    fileSize: '78.5 MB',
    status: 'completed',
    progress: 100,
    uploadedAt: '2024-01-26T10:15:00',
    uploadedBy: 'Alex Turner',
    department: 'Design',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=100&h=100&fit=crop'
  },
  {
    id: '5',
    fileName: 'Podcast-Episode-12.mp3',
    fileType: 'audio',
    fileSize: '32.1 MB',
    status: 'failed',
    progress: 45,
    uploadedAt: '2024-01-26T10:10:00',
    uploadedBy: 'Rachel Green',
    department: 'Communications'
  },
  {
    id: '6',
    fileName: 'Website-Mockup-v3.fig',
    fileType: 'document',
    fileSize: '125.7 MB',
    status: 'completed',
    progress: 100,
    uploadedAt: '2024-01-26T10:05:00',
    uploadedBy: 'David Kim',
    department: 'UI/UX'
  }
]

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image':
      return <PhotoIcon className="w-5 h-5" />
    case 'video':
      return <VideoCameraIcon className="w-5 h-5" />
    case 'audio':
      return <MusicalNoteIcon className="w-5 h-5" />
    case '3d':
      return <CubeIcon className="w-5 h-5" />
    case 'document':
    default:
      return <DocumentIcon className="w-5 h-5" />
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />
    case 'uploading':
      return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
    case 'processing':
      return <ClockIcon className="w-5 h-5 text-yellow-500" />
    case 'failed':
      return <XCircleIcon className="w-5 h-5 text-red-500" />
    default:
      return null
  }
}

const getStatusText = (status: string, progress: number) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'uploading':
      return `Uploading... ${progress}%`
    case 'processing':
      return `Processing... ${progress}%`
    case 'failed':
      return 'Upload Failed'
    default:
      return 'Unknown'
  }
}

export default function UploadActivity({ lng }: { lng: string }) {
  const [filter, setFilter] = useState<'all' | 'completed' | 'uploading' | 'failed' | 'processing'>('all')
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  
  const filteredActivity = mockUploadActivity.filter(item => {
    if (filter === 'all') return true
    return item.status === filter
  })

  const stats = {
    total: mockUploadActivity.length,
    completed: mockUploadActivity.filter(item => item.status === 'completed').length,
    uploading: mockUploadActivity.filter(item => item.status === 'uploading').length,
    processing: mockUploadActivity.filter(item => item.status === 'processing').length,
    failed: mockUploadActivity.filter(item => item.status === 'failed').length,
    totalSize: '723.4 MB'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ArrowUpTrayIcon className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Upload Activity</h3>
            <p className="text-sm text-white/60">Recent uploads and processing status</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['today', 'week', 'month'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/60">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-white/60">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.uploading}</div>
          <div className="text-xs text-white/60">Uploading</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.processing}</div>
          <div className="text-xs text-white/60">Processing</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
          <div className="text-xs text-white/60">Failed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 pb-4 border-b border-white/10">
        {(['all', 'completed', 'uploading', 'processing', 'failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === status
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Upload List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivity.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
            {/* File Icon/Thumbnail */}
            <div className="flex-shrink-0">
              {item.thumbnail ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                  <ClientImage 
                    src={item.thumbnail} 
                    alt={item.fileName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  item.fileType === 'image' ? 'bg-blue-500/20 text-blue-400' :
                  item.fileType === 'video' ? 'bg-red-500/20 text-red-400' :
                  item.fileType === 'audio' ? 'bg-yellow-500/20 text-yellow-400' :
                  item.fileType === '3d' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {getFileIcon(item.fileType)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-white truncate">{item.fileName}</h4>
                {getStatusIcon(item.status)}
              </div>
              <div className="flex items-center gap-4 text-xs text-white/60 mt-1">
                <span>{item.fileSize}</span>
                <span>•</span>
                <span>{item.uploadedBy}</span>
                <span>•</span>
                <span>{item.department}</span>
                <span>•</span>
                <span>{formatTime(item.uploadedAt)}</span>
              </div>
              
              {/* Progress Bar */}
              {(item.status === 'uploading' || item.status === 'processing') && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60">{getStatusText(item.status, item.progress)}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'uploading' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {item.status === 'completed' && (
                <Link
                  href={`/${lng}/asset/${item.id}`}
                  className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  View
                </Link>
              )}
              {item.status === 'failed' && (
                <button className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors">
                  Retry
                </button>
              )}
              {(item.status === 'uploading' || item.status === 'processing') && (
                <button className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="text-sm text-white/60">
          Total uploaded: <span className="text-white font-medium">{stats.totalSize}</span>
        </div>
        <Link 
          href={`/${lng}/activity`}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View all activity →
        </Link>
      </div>
    </div>
  )
}