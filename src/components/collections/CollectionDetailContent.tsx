'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import { Menu, Transition } from '@headlessui/react'
import { 
  ArrowLeftIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  HeartIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  FolderIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import AssetCard from '@/components/AssetCard'

interface Asset {
  id: string
  title: string
  type: '2d' | '3d' | 'video' | 'audio' | 'document'
  thumbnail: string
  fileSize: string
  uploadDate: string
  uploadedBy: string
  downloads: number
  likes: number
  isLiked: boolean
  tags: string[]
  description?: string
}

interface CollectionDetail {
  id: string
  name: string
  description: string
  coverImage: string
  createdBy: string
  createdAt: string
  updatedAt: string
  isPrivate: boolean
  tags: string[]
  totalAssets: number
  totalSize: string
  collaborators: string[]
}

// Mock collection data
const mockCollection: CollectionDetail = {
  id: '1',
  name: 'Brand Assets 2024',
  description: 'Complete collection of brand guidelines, logos, and marketing materials for the 2024 campaign. This collection includes all approved assets for internal and external use.',
  coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1600&h=400&fit=crop',
  createdBy: 'Sarah Johnson',
  createdAt: '2024-01-15',
  updatedAt: '2024-01-25',
  isPrivate: false,
  tags: ['branding', 'marketing', 'logos', '2024'],
  totalAssets: 156,
  totalSize: '2.4 GB',
  collaborators: ['John Doe', 'Jane Smith', 'Mike Wilson']
}

// Mock assets data
const mockAssets: Asset[] = [
  {
    id: '1',
    title: 'Company Logo - Primary',
    type: '2d',
    thumbnail: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=400&h=225&fit=crop',
    fileSize: '2.5 MB',
    uploadDate: '2024-01-20',
    uploadedBy: 'Design Team',
    downloads: 234,
    likes: 45,
    isLiked: true,
    tags: ['logo', 'primary', 'brand'],
    description: 'Primary company logo in various formats'
  },
  {
    id: '2',
    title: 'Brand Guidelines Document',
    type: 'document',
    thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=225&fit=crop',
    fileSize: '15.3 MB',
    uploadDate: '2024-01-18',
    uploadedBy: 'Brand Team',
    downloads: 189,
    likes: 32,
    isLiked: false,
    tags: ['guidelines', 'brand', 'document']
  },
  {
    id: '3',
    title: 'Product Showcase Video',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=225&fit=crop',
    fileSize: '125.8 MB',
    uploadDate: '2024-01-22',
    uploadedBy: 'Video Team',
    downloads: 567,
    likes: 89,
    isLiked: true,
    tags: ['video', 'product', 'showcase']
  },
  {
    id: '4',
    title: '3D Product Model',
    type: '3d',
    thumbnail: 'https://images.unsplash.com/photo-1633600796230-0f7b1d49e6a0?w=400&h=225&fit=crop',
    fileSize: '45.2 MB',
    uploadDate: '2024-01-19',
    uploadedBy: '3D Team',
    downloads: 123,
    likes: 56,
    isLiked: false,
    tags: ['3d', 'product', 'model']
  },
  {
    id: '5',
    title: 'Marketing Poster Template',
    type: '2d',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=225&fit=crop',
    fileSize: '8.7 MB',
    uploadDate: '2024-01-21',
    uploadedBy: 'Marketing Team',
    downloads: 345,
    likes: 67,
    isLiked: true,
    tags: ['poster', 'template', 'marketing']
  },
  {
    id: '6',
    title: 'Brand Music Theme',
    type: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
    fileSize: '12.4 MB',
    uploadDate: '2024-01-23',
    uploadedBy: 'Audio Team',
    downloads: 89,
    likes: 23,
    isLiked: false,
    tags: ['audio', 'music', 'theme']
  }
]

export default function CollectionDetailContent({ 
  lng, 
  collectionId 
}: { 
  lng: string
  collectionId: string 
}) {
  const [assets, setAssets] = useState<Asset[]>(mockAssets)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewType, setViewType] = useState('grid')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('recent')
  const [showFilters, setShowFilters] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const handleLike = (assetId: string) => {
    setAssets(assets.map(asset =>
      asset.id === assetId
        ? { ...asset, isLiked: !asset.isLiked, likes: asset.isLiked ? asset.likes - 1 : asset.likes + 1 }
        : asset
    ))
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || asset.type === filterType
    return matchesSearch && matchesType
  })

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'size':
        return parseFloat(b.fileSize) - parseFloat(a.fileSize)
      case 'downloads':
        return b.downloads - a.downloads
      case 'recent':
      default:
        return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    }
  })

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${lng}/collections/${collectionId}`
    : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <Link 
        href={`/${lng}/collections`}
        className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back to Collections</span>
      </Link>

      {/* Collection Header */}
      <div className="relative mb-8 rounded-3xl overflow-hidden h-64">
        <ClientImage 
          src={mockCollection.coverImage} 
          alt={mockCollection.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-3">{mockCollection.name}</h1>
              <p className="text-white/80 text-lg max-w-3xl mb-4">{mockCollection.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4" />
                  <span>{mockCollection.totalAssets} assets</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Updated {new Date(mockCollection.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>By {mockCollection.createdBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  <span>{mockCollection.totalSize}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setShowShareModal(true)}
                className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
              >
                <ShareIcon className="w-5 h-5 text-white" />
              </button>
              
              {/* More Options Dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
                  <EllipsisHorizontalIcon className="w-5 h-5 text-white" />
                </Menu.Button>
                
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-gray-800 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center px-4 py-3 text-sm text-white transition-colors`}
                          >
                            <PencilIcon className="mr-3 h-5 w-5 text-white/70" />
                            Edit Collection
                          </button>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center px-4 py-3 text-sm text-white transition-colors`}
                          >
                            <UserGroupIcon className="mr-3 h-5 w-5 text-white/70" />
                            Manage Collaborators
                          </button>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center px-4 py-3 text-sm text-white transition-colors`}
                          >
                            {mockCollection.isPrivate ? (
                              <LockOpenIcon className="mr-3 h-5 w-5 text-white/70" />
                            ) : (
                              <LockClosedIcon className="mr-3 h-5 w-5 text-white/70" />
                            )}
                            {mockCollection.isPrivate ? 'Make Public' : 'Make Private'}
                          </button>
                        )}
                      </Menu.Item>
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-white/10' : ''
                            } group flex w-full items-center px-4 py-3 text-sm text-white transition-colors`}
                          >
                            <ArrowDownTrayIcon className="mr-3 h-5 w-5 text-white/70" />
                            Download All Assets
                          </button>
                        )}
                      </Menu.Item>
                      
                      <div className="h-px bg-white/10 my-1" />
                      
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-red-500/20' : ''
                            } group flex w-full items-center px-4 py-3 text-sm text-red-400 transition-colors`}
                          >
                            <TrashIcon className="mr-3 h-5 w-5" />
                            Delete Collection
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-8">
        {mockCollection.tags.map(tag => (
          <span 
            key={tag}
            className="px-3 py-1.5 bg-white/10 text-white/80 text-sm rounded-lg backdrop-blur-sm"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-white/10">
              <MagnifyingGlassIcon className="w-5 h-5 text-white group-focus-within:text-purple-400 transition-all duration-200" />
            </div>
            <input
              type="text"
              placeholder="Search assets in this collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative w-full pl-14 pr-12 py-3.5 bg-black/40 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:bg-black/50 backdrop-blur-xl transition-all duration-200 hover:bg-black/50 hover:border-white/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 text-white/40 hover:text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
        </button>

        {/* View Type */}
        <div className="flex bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
          <button
            onClick={() => setViewType('grid')}
            className={`p-3 rounded-lg transition-colors ${
              viewType === 'grid'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-3 rounded-lg transition-colors ${
              viewType === 'list'
                ? 'bg-white/20 text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-8 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-white/70 text-sm mb-2">Type</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Types</option>
                <option value="2d">Images</option>
                <option value="3d">3D Models</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white/70 text-sm mb-2">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Name</option>
                <option value="size">File Size</option>
                <option value="downloads">Downloads</option>
              </select>
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Date Range</label>
              <select className="w-full px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option>All Time</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>Last Year</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-white/70">
          Showing {sortedAssets.length} of {mockCollection.totalAssets} assets
        </p>
        <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
          Download All
        </button>
      </div>

      {/* Assets Grid */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              {...asset}
              lng={lng}
              year="2024"
              usage="Internal"
              company="Acme Corp"
              translations={{
                download: 'Download',
                preview: 'Preview'
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssets.map((asset) => (
            <div key={asset.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <ClientImage
                    src={asset.thumbnail}
                    alt={asset.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">{asset.title}</h3>
                  <p className="text-white/70 text-sm mb-2">{asset.description || 'No description available'}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                    <span>{asset.fileSize}</span>
                    <span>{asset.uploadDate}</span>
                    <span>{asset.uploadedBy}</span>
                    <span>{asset.downloads} downloads</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLike(asset.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {asset.isLiked ? (
                      <HeartSolidIcon className="w-5 h-5 text-red-500" />
                    ) : (
                      <HeartIcon className="w-5 h-5 text-white/70" />
                    )}
                  </button>
                  <Link 
                    href={`/${lng}/asset/${asset.id}`}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <EyeIcon className="w-5 h-5 text-white/70" />
                  </Link>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <DocumentArrowDownIcon className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedAssets.length === 0 && (
        <div className="text-center py-16">
          <FolderIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No assets found</h3>
          <p className="text-white/70">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Share Modal */}
      <Transition show={showShareModal} as={Fragment}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="relative transform overflow-hidden rounded-2xl bg-gray-800 backdrop-blur-xl border border-white/20 p-6 text-left align-middle shadow-xl transition-all w-full max-w-md">
                <h3 className="text-lg font-medium leading-6 text-white mb-4">
                  Share Collection
                </h3>
                
                <p className="text-sm text-white/70 mb-4">
                  Share this collection with others using the link below:
                </p>

                <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg border border-white/20">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-transparent text-white text-sm outline-none cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                      setIsCopied(true)
                      setTimeout(() => setIsCopied(false), 2000)
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {isCopied ? (
                      <CheckIcon className="w-5 h-5 text-green-400" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5 text-white/70" />
                    )}
                  </button>
                </div>


                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Transition>
    </div>
  )
}