'use client'

import { useState, useEffect } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

interface SearchResult {
  id: string
  title: string
  type: 'image' | 'video' | 'document' | 'audio'
  thumbnail: string
  description: string
  uploadedBy: string
  uploadDate: string
  tags: string[]
  views: number
  downloads: number
  fileSize: string
  isLiked: boolean
  collection?: string
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Brand Logo Collection',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    description: 'Complete set of brand logos in various formats and variations',
    uploadedBy: 'Sarah Johnson',
    uploadDate: '2024-01-20',
    tags: ['branding', 'logos', 'design', 'marketing'],
    views: 1245,
    downloads: 89,
    fileSize: '12.4 MB',
    isLiked: true,
    collection: 'Brand Assets'
  },
  {
    id: '2',
    title: 'Product Demo Video',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
    description: 'Comprehensive product demonstration showcasing key features',
    uploadedBy: 'Mike Chen',
    uploadDate: '2024-01-18',
    tags: ['product', 'demo', 'video', 'marketing'],
    views: 2340,
    downloads: 156,
    fileSize: '245.8 MB',
    isLiked: false,
    collection: 'Video Content'
  },
  {
    id: '3',
    title: 'Q4 Financial Report',
    type: 'document',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    description: 'Quarterly financial analysis and performance metrics',
    uploadedBy: 'Emma Wilson',
    uploadDate: '2024-01-15',
    tags: ['finance', 'report', 'quarterly', 'analysis'],
    views: 567,
    downloads: 234,
    fileSize: '5.2 MB',
    isLiked: false
  },
  {
    id: '4',
    title: 'Podcast Episode - Innovation',
    type: 'audio',
    thumbnail: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=300&fit=crop',
    description: 'Discussion about innovation in technology and business',
    uploadedBy: 'James Rodriguez',
    uploadDate: '2024-01-12',
    tags: ['podcast', 'innovation', 'technology', 'business'],
    views: 890,
    downloads: 67,
    fileSize: '45.6 MB',
    isLiked: true,
    collection: 'Audio Content'
  },
  {
    id: '5',
    title: 'Social Media Templates',
    type: 'image',
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    description: 'Ready-to-use templates for social media campaigns',
    uploadedBy: 'Lisa Anderson',
    uploadDate: '2024-01-10',
    tags: ['social-media', 'templates', 'marketing', 'design'],
    views: 1678,
    downloads: 345,
    fileSize: '78.9 MB',
    isLiked: true,
    collection: 'Marketing Assets'
  },
  {
    id: '6',
    title: 'Team Building Workshop',
    type: 'video',
    thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
    description: 'Recording of our latest team building activities and exercises',
    uploadedBy: 'Alex Brown',
    uploadDate: '2024-01-08',
    tags: ['team-building', 'workshop', 'hr', 'training'],
    views: 432,
    downloads: 78,
    fileSize: '156.3 MB',
    isLiked: false,
    collection: 'Training Content'
  }
]

const fileTypes = [
  { id: 'all', name: 'All Types', icon: DocumentIcon },
  { id: 'image', name: 'Images', icon: PhotoIcon },
  { id: 'video', name: 'Videos', icon: VideoCameraIcon },
  { id: 'document', name: 'Documents', icon: DocumentIcon },
  { id: 'audio', name: 'Audio', icon: MusicalNoteIcon }
]

const sortOptions = [
  { id: 'relevance', name: 'Most Relevant' },
  { id: 'date', name: 'Most Recent' },
  { id: 'views', name: 'Most Viewed' },
  { id: 'downloads', name: 'Most Downloaded' },
  { id: 'name', name: 'Name A-Z' }
]

const popularTags = [
  'branding', 'marketing', 'design', 'video', 'presentation', 
  'social-media', 'templates', 'logos', 'finance', 'reports'
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SearchContent({ lng }: { lng: string }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>(mockResults)
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>(mockResults)
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState('all')
  const [isSearching, setIsSearching] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  // Search and filter logic
  useEffect(() => {
    setIsSearching(true)
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      const filtered = results.filter(item => {
        const matchesQuery = searchQuery === '' || 
                           item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           item.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesType = selectedType === 'all' || item.type === selectedType

        const matchesTags = selectedTags.length === 0 || 
                           selectedTags.some(tag => item.tags.includes(tag))

        const matchesDate = dateRange === 'all' || (() => {
          const itemDate = new Date(item.uploadDate)
          const now = new Date()
          const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24))
          
          switch(dateRange) {
            case 'week': return daysDiff <= 7
            case 'month': return daysDiff <= 30
            case 'year': return daysDiff <= 365
            default: return true
          }
        })()

        return matchesQuery && matchesType && matchesTags && matchesDate
      })

      // Sort results
      filtered.sort((a, b) => {
        switch(sortBy) {
          case 'date':
            return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          case 'views':
            return b.views - a.views
          case 'downloads':
            return b.downloads - a.downloads
          case 'name':
            return a.title.localeCompare(b.title)
          case 'relevance':
          default:
            // Simple relevance scoring based on query match
            if (searchQuery === '') return 0
            const aScore = (a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 10 : 0) +
                          (a.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 5 : 0) +
                          a.tags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())).length
            const bScore = (b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 10 : 0) +
                          (b.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 5 : 0) +
                          b.tags.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())).length
            return bScore - aScore
        }
      })

      setFilteredResults(filtered)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedType, sortBy, selectedTags, dateRange, results])

  const handleLike = (resultId: string) => {
    setResults(results.map(result =>
      result.id === resultId ? { ...result, isLiked: !result.isLiked } : result
    ))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return PhotoIcon
      case 'video': return VideoCameraIcon
      case 'document': return DocumentIcon
      case 'audio': return MusicalNoteIcon
      default: return DocumentIcon
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-green-400 bg-green-500/10'
      case 'video': return 'text-blue-400 bg-blue-500/10'
      case 'document': return 'text-purple-400 bg-purple-500/10'
      case 'audio': return 'text-orange-400 bg-orange-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Search Content</h1>
        <p className="text-white/70 text-lg">Find exactly what you&apos;re looking for</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-3xl mx-auto">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50" />
        <input
          type="text"
          placeholder={searchFocused || searchQuery ? "" : "Search for files, collections, or content..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white text-lg placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Popular Tags */}
      {searchQuery === '' && (
        <div className="mb-8 text-center">
          <p className="text-white/70 mb-4">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white/80 hover:text-white text-sm transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* File Type Filter */}
        <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
          {fileTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedType === type.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.name}
            </button>
          ))}
        </div>

        <div className="flex gap-4 flex-1">
          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors border ${
              showFilters || selectedTags.length > 0
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 border-white/20'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            Filters
            {selectedTags.length > 0 && (
              <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                {selectedTags.length}
              </span>
            )}
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id} className="bg-gray-800">
                {option.name}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tags Filter */}
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date Range
              </h4>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all" className="bg-gray-800">All Time</option>
                <option value="week" className="bg-gray-800">Past Week</option>
                <option value="month" className="bg-gray-800">Past Month</option>
                <option value="year" className="bg-gray-800">Past Year</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedTags([])
                  setDateRange('all')
                  setSelectedType('all')
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-white">
          <span className="text-lg font-medium">
            {filteredResults.length.toLocaleString()} results
          </span>
          {searchQuery && (
            <span className="text-white/70 ml-2">for &quot;{searchQuery}&quot;</span>
          )}
        </div>
      </div>

      {/* Results Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredResults.map(result => {
            const TypeIcon = getTypeIcon(result.type)
            return (
              <div key={result.id} className="group backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-[1.02]">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <ClientImage
                    src={result.thumbnail}
                    alt={result.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Type Badge */}
                  <div className="absolute top-3 left-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(result.type)}`}>
                      <TypeIcon className="w-3 h-3" />
                      {result.type}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleLike(result.id)}
                      className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      {result.isLiked ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                      <EyeIcon className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                      <ArrowDownTrayIcon className="w-4 h-4 text-white" />
                    </button>
                    <button className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                      <ShareIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1 mb-2">
                    {result.title}
                  </h3>
                  
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {result.description}
                  </p>

                  <div className="flex items-center text-sm text-white/60 mb-3">
                    <UserIcon className="w-4 h-4 mr-1" />
                    <span className="mr-4">{result.uploadedBy}</span>
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    <span>{new Date(result.uploadDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-white/60 mb-3">
                    <span>{result.views} views</span>
                    <span>{result.downloads} downloads</span>
                    <span>{result.fileSize}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {result.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                    {result.tags.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg">
                        +{result.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Results List */
        <div className="space-y-4">
          {filteredResults.map(result => {
            const TypeIcon = getTypeIcon(result.type)
            return (
              <div key={result.id} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-start gap-6">
                  {/* Thumbnail */}
                  <div className="relative w-32 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <ClientImage
                      src={result.thumbnail}
                      alt={result.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(result.type)}`}>
                        <TypeIcon className="w-3 h-3" />
                        {result.type}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-semibold text-white hover:text-purple-300 transition-colors">
                        {result.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLike(result.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {result.isLiked ? (
                            <HeartSolidIcon className="w-5 h-5 text-red-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-white/70" />
                          )}
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <EyeIcon className="w-5 h-5 text-white/70" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <ArrowDownTrayIcon className="w-5 h-5 text-white/70" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <ShareIcon className="w-5 h-5 text-white/70" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-white/70 mb-3 line-clamp-2">
                      {result.description}
                    </p>

                    <div className="flex items-center text-sm text-white/60 mb-3">
                      <UserIcon className="w-4 h-4 mr-1" />
                      <span className="mr-6">{result.uploadedBy}</span>
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span className="mr-6">{new Date(result.uploadDate).toLocaleDateString()}</span>
                      <span className="mr-6">{result.views} views</span>
                      <span className="mr-6">{result.downloads} downloads</span>
                      <span>{result.fileSize}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.tags.map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No Results */}
      {filteredResults.length === 0 && !isSearching && (
        <div className="text-center py-16">
          <MagnifyingGlassIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-white/70 mb-6">
            {searchQuery 
              ? `No content matches &quot;${searchQuery}&quot;. Try adjusting your search or filters.`
              : 'Try adjusting your filters to see more results.'
            }
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedType('all')
              setSelectedTags([])
              setDateRange('all')
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02]"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  )
}