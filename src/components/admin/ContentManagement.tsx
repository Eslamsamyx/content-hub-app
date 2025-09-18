'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { MagnifyingGlassIcon, EyeIcon, TrashIcon, ArrowDownTrayIcon, ShareIcon, PhotoIcon, VideoCameraIcon, DocumentIcon, MusicalNoteIcon, CubeIcon, PaintBrushIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline'

interface ContentItem {
  id: string
  name: string
  type: 'image' | 'video' | 'document' | 'audio' | '3d' | 'design' | 'archive'
  size: string
  uploadedBy: string
  uploadDate: string
  downloads: number
  views: number
  status: 'active' | 'archived' | 'flagged'
  thumbnail: string
}

const mockContent: ContentItem[] = [
  {
    id: '1',
    name: 'Brand Logo Collection.zip',
    type: 'image',
    size: '12.4 MB',
    uploadedBy: 'Sarah Johnson',
    uploadDate: '2024-01-20',
    downloads: 145,
    views: 892,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop'
  },
  {
    id: '2',
    name: 'Product Demo Video.mp4',
    type: 'video',
    size: '245.8 MB',
    uploadedBy: 'Mike Chen',
    uploadDate: '2024-01-18',
    downloads: 67,
    views: 1234,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=100&h=100&fit=crop'
  },
  {
    id: '3',
    name: 'Q4 Report.pdf',
    type: 'document',
    size: '5.2 MB',
    uploadedBy: 'Emma Wilson',
    uploadDate: '2024-01-15',
    downloads: 89,
    views: 456,
    status: 'flagged',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: '4',
    name: 'Podcast Episode 12.mp3',
    type: 'audio',
    size: '45.6 MB',
    uploadedBy: 'James Rodriguez',
    uploadDate: '2024-01-12',
    downloads: 234,
    views: 1567,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop'
  },
  {
    id: '5',
    name: 'Marketing Assets.zip',
    type: 'archive',
    size: '78.9 MB',
    uploadedBy: 'Lisa Anderson',
    uploadDate: '2024-01-10',
    downloads: 56,
    views: 323,
    status: 'archived',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
  },
  {
    id: '6',
    name: 'Product 3D Model.glb',
    type: '3d',
    size: '124.3 MB',
    uploadedBy: 'David Kim',
    uploadDate: '2024-01-08',
    downloads: 78,
    views: 445,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop'
  },
  {
    id: '7',
    name: 'Brand Guidelines.psd',
    type: 'design',
    size: '156.7 MB',
    uploadedBy: 'Anna Martinez',
    uploadDate: '2024-01-05',
    downloads: 134,
    views: 789,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100&h=100&fit=crop'
  },
  {
    id: '8',
    name: 'UI Kit Components.fig',
    type: 'design',
    size: '45.2 MB',
    uploadedBy: 'Tom Wilson',
    uploadDate: '2024-01-03',
    downloads: 92,
    views: 567,
    status: 'active',
    thumbnail: 'https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=100&h=100&fit=crop'
  }
]

const contentTypes = ['all', 'image', 'video', 'document', 'audio', '3d', 'design', 'archive']
const statusTypes = ['all', 'active', 'archived', 'flagged']
const sortOptions = ['name', 'uploadDate', 'size', 'downloads', 'views']

export default function ContentManagement() {
  const [content, setContent] = useState<ContentItem[]>(mockContent)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('uploadDate')
  const [searchFocused, setSearchFocused] = useState(false)

  const filteredContent = content.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const sortedContent = [...filteredContent].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return parseFloat(b.size) - parseFloat(a.size)
      case 'downloads':
        return b.downloads - a.downloads
      case 'views':
        return b.views - a.views
      case 'uploadDate':
      default:
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    }
  })

  const handleStatusChange = (itemId: string, newStatus: ContentItem['status']) => {
    setContent(content.map(item =>
      item.id === itemId ? { ...item, status: newStatus } : item
    ))
  }

  const getTypeIcon = (type: string) => {
    const iconProps = "w-5 h-5 text-white/70"
    
    switch (type) {
      case 'image':
        return <PhotoIcon className={iconProps} />
      case 'video':
        return <VideoCameraIcon className={iconProps} />
      case 'document':
        return <DocumentIcon className={iconProps} />
      case 'audio':
        return <MusicalNoteIcon className={iconProps} />
      case '3d':
        return <CubeIcon className={iconProps} />
      case 'design':
        return <PaintBrushIcon className={iconProps} />
      case 'archive':
        return <ArchiveBoxIcon className={iconProps} />
      default:
        return <DocumentIcon className={iconProps} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'archived':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'flagged':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatFileSize = (size: string) => {
    const num = parseFloat(size)
    if (num >= 1024) {
      return `${(num / 1024).toFixed(1)} GB`
    }
    return size
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder={searchFocused || searchQuery ? "" : "Search content..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
          />
        </div>

        {/* Filters */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          <option value="all" className="bg-gray-800">All Types</option>
          {contentTypes.slice(1).map(type => (
            <option key={type} value={type} className="bg-gray-800">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          <option value="all" className="bg-gray-800">All Status</option>
          {statusTypes.slice(1).map(status => (
            <option key={status} value={status} className="bg-gray-800">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          {sortOptions.map(option => (
            <option key={option} value={option} className="bg-gray-800">
              Sort by {option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Content Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Content</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Type</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Size</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Uploaded By</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Date</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Stats</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Status</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedContent.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                        <ClientImage
                          src={item.thumbnail}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium line-clamp-1">{item.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-white/80 capitalize">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/80">{formatFileSize(item.size)}</td>
                  <td className="px-6 py-4 text-white/80">{item.uploadedBy}</td>
                  <td className="px-6 py-4 text-white/60 text-sm">
                    {new Date(item.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white/80">
                      <div>{item.views} views</div>
                      <div>{item.downloads} downloads</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as ContentItem['status'])}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${getStatusColor(item.status)}`}
                    >
                      <option value="active" className="bg-gray-800">Active</option>
                      <option value="archived" className="bg-gray-800">Archived</option>
                      <option value="flagged" className="bg-gray-800">Flagged</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Share"
                      >
                        <ShareIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{content.length}</div>
          <div className="text-white/70 text-sm">Total Items</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {content.filter(item => item.status === 'active').length}
          </div>
          <div className="text-white/70 text-sm">Active</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {content.filter(item => item.status === 'flagged').length}
          </div>
          <div className="text-white/70 text-sm">Flagged</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {content.reduce((total, item) => total + item.downloads, 0)}
          </div>
          <div className="text-white/70 text-sm">Total Downloads</div>
        </div>
      </div>
    </div>
  )
}