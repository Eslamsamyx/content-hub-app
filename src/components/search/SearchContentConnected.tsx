'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ClientImage from '@/components/common/ClientImage'
import Link from 'next/link'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  Squares2X2Icon, 
  ListBulletIcon,
  TagIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  HeartIcon,
  ShareIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { useSearch, useSearchSuggestions } from '@/hooks/use-api'
import debounce from 'lodash/debounce'

interface SearchContentConnectedProps {
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

export default function SearchContentConnected({ lng }: SearchContentConnectedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState({
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    dateRange: searchParams.get('dateRange') || '',
    user: searchParams.get('user') || ''
  })

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Search API
  const { data: searchData, loading: searchLoading } = useSearch(searchQuery, {
    type: selectedFilters.type || undefined,
    category: selectedFilters.category || undefined,
    tags: selectedFilters.tags.length > 0 ? selectedFilters.tags : undefined,
    dateRange: selectedFilters.dateRange || undefined,
    user: selectedFilters.user || undefined
  })

  // Suggestions API
  const { data: suggestionsData } = useSearchSuggestions(
    searchQuery.length >= 2 ? searchQuery : ''
  )

  const results = searchData?.results || []
  const facets = searchData?.facets || {}
  const suggestions = suggestionsData?.suggestions || []

  // Debounced search handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (selectedFilters.type) params.set('type', selectedFilters.type)
      if (selectedFilters.category) params.set('category', selectedFilters.category)
      if (selectedFilters.tags.length > 0) params.set('tags', selectedFilters.tags.join(','))
      if (selectedFilters.dateRange) params.set('dateRange', selectedFilters.dateRange)
      if (selectedFilters.user) params.set('user', selectedFilters.user)
      
      router.push(`/${lng}/search?${params.toString()}`)
    }, 300),
    [selectedFilters, lng, router]
  )

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    }
  }, [searchQuery, debouncedSearch])

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFilterChange = (filterType: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleTagToggle = (tag: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const handleSuggestionClick = (suggestion: any) => {
    setSearchQuery(suggestion.query || suggestion.name || suggestion.title)
    setShowSuggestions(false)
    searchInputRef.current?.focus()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Search</h1>
        
        {/* Search Bar */}
        <div className="relative" ref={suggestionsRef}>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for assets, collections, or tags..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(e.target.value.length >= 2)
              }}
              onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
              className="pl-12 pr-4 py-4 w-full text-lg border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
              {/* Recent Searches */}
              {suggestions.some((s: any) => s.type === 'recent') && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Recent Searches</p>
                  {suggestions
                    .filter((s: any) => s.type === 'recent')
                    .map((suggestion: any, index: number) => (
                      <button
                        key={`recent-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{suggestion.query}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Assets */}
              {suggestions.some((s: any) => s.type === 'asset') && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Assets</p>
                  {suggestions
                    .filter((s: any) => s.type === 'asset')
                    .map((suggestion: any) => {
                      const Icon = typeIcons[suggestion.assetType] || DocumentIcon
                      return (
                        <button
                          key={`asset-${suggestion.id}`}
                          onClick={() => router.push(`/${lng}/asset/${suggestion.id}`)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                        >
                          <Icon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">{suggestion.title}</span>
                        </button>
                      )
                    })}
                </div>
              )}

              {/* Collections */}
              {suggestions.some((s: any) => s.type === 'collection') && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Collections</p>
                  {suggestions
                    .filter((s: any) => s.type === 'collection')
                    .map((suggestion: any) => (
                      <button
                        key={`collection-${suggestion.id}`}
                        onClick={() => router.push(`/${lng}/collections/${suggestion.id}`)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                      >
                        <FolderIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{suggestion.name}</span>
                      </button>
                    ))}
                </div>
              )}

              {/* Tags */}
              {suggestions.some((s: any) => s.type === 'tag') && (
                <div className="p-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 px-2 pb-1">Tags</p>
                  {suggestions
                    .filter((s: any) => s.type === 'tag')
                    .map((suggestion: any) => (
                      <button
                        key={`tag-${suggestion.id}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                      >
                        <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{suggestion.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
        >
          <FunnelIcon className="h-5 w-5" />
          <span>Filters</span>
          {Object.values(selectedFilters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && (
            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
              {Object.values(selectedFilters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length}
            </span>
          )}
        </button>

        <div className="flex-1" />

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
          >
            <Squares2X2Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow' : ''}`}
          >
            <ListBulletIcon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                value={selectedFilters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">All Types</option>
                <option value="IMAGE">Images</option>
                <option value="VIDEO">Videos</option>
                <option value="DOCUMENT">Documents</option>
                <option value="AUDIO">Audio</option>
                <option value="MODEL_3D">3D Models</option>
                <option value="DESIGN">Designs</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">All Categories</option>
                {facets.categories?.map((cat: any) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={selectedFilters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setSelectedFilters({
                  type: '',
                  category: '',
                  tags: [],
                  dateRange: '',
                  user: ''
                })}
                className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          {facets.tags && facets.tags.length > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {facets.tags.map((tag: any) => (
                  <button
                    key={tag.value}
                    onClick={() => handleTagToggle(tag.value)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedFilters.tags.includes(tag.value)
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag.label} ({tag.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {searchLoading ? (
          <span>Searching...</span>
        ) : (
          <span>
            {results.length} results found
            {searchQuery && ` for "${searchQuery}"`}
          </span>
        )}
      </div>

      {/* Search Results */}
      {searchLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No results found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result: any) => {
            const Icon = typeIcons[result.type] || DocumentIcon
            const iconColor = typeColors[result.type] || 'text-gray-600'
            
            return (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/${lng}/asset/${result.id}`}>
                  <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                    {result.thumbnailUrl ? (
                      <ClientImage
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className={`h-16 w-16 ${iconColor}`} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-white/90 dark:bg-black/70 ${iconColor}`}>
                        {result.type}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                    {result.title}
                  </h3>
                  {result.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span>{result.uploadedBy?.name || 'Unknown'}</span>
                    <span>{formatDate(result.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        {result.viewCount || 0}
                      </span>
                      <span className="flex items-center">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        {result.downloadCount || 0}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <HeartIcon className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                        <ShareIcon className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result: any) => {
            const Icon = typeIcons[result.type] || DocumentIcon
            const iconColor = typeColors[result.type] || 'text-gray-600'
            
            return (
              <div key={result.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {result.thumbnailUrl ? (
                      <ClientImage
                        src={result.thumbnailUrl}
                        alt={result.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className={`h-12 w-12 ${iconColor}`} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link href={`/${lng}/asset/${result.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary">
                        {result.title}
                      </h3>
                    </Link>
                    {result.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {result.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`flex items-center ${iconColor}`}>
                        <Icon className="h-4 w-4 mr-1" />
                        {result.type}
                      </span>
                      <span>{formatFileSize(result.fileSize)}</span>
                      <span>{result.uploadedBy?.name || 'Unknown'}</span>
                      <span>{formatDate(result.createdAt)}</span>
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.tags.slice(0, 5).map((tag: any) => (
                          <span key={tag.id} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                            {tag.name}
                          </span>
                        ))}
                        {result.tags.length > 5 && (
                          <span className="px-2 py-1 text-xs text-gray-500">
                            +{result.tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {result.viewCount || 0}
                    </span>
                    <span className="flex items-center">
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      {result.downloadCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}