'use client'

import { useState, useCallback, Fragment } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import SearchBar from '@/components/SearchBar'
import AdvancedFilterSidebar from '@/components/AdvancedFilterSidebar'
import AssetCard from '@/components/AssetCard'
import { useAssets, useSearch } from '@/hooks/use-api'

interface ExploreContentConnectedProps {
  lng: string
  preselectedCategory?: string
  categoryTitle?: string
  initialType?: string
  translations: {
    searchPlaceholder: string
    filters: {
      all: string
      type: string
      date: string
      tags: string
      year: string
      company: string
    }
    sort: {
      newest: string
      oldest: string
      name: string
      popular: string
    }
    actions: {
      download: string
      preview: string
    }
    loading?: string
    error?: string
    noResults?: string
  }
}

export default function ExploreContentConnected({ 
  lng, 
  preselectedCategory, 
  categoryTitle, 
  initialType, 
  translations 
}: ExploreContentConnectedProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState({
    types: initialType ? [initialType] : [],
    category: preselectedCategory,
    tags: [] as string[],
    year: '',
    company: '',
    eventName: '',
    usage: '',
    readyForPublishing: false,
    dateRange: null as { start: string; end: string } | null
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const { data: session } = useSession()
  
  // Check if user has download permission
  const canDownload = session?.user?.role && [
    'ADMIN', 
    'CONTENT_MANAGER', 
    'USER'
  ].includes(session.user.role)

  // Use search if there's a query, otherwise use assets
  const searchResults = useSearch(searchQuery, {
    types: filters.types.length > 0 ? filters.types.join(',') : undefined,
    category: filters.category,
    tags: filters.tags.length > 0 ? filters.tags.join(',') : undefined,
    company: filters.company,
    eventName: filters.eventName,
    usage: filters.usage,
    readyForPublishing: filters.readyForPublishing || undefined,
    page: currentPage,
    limit: pageSize
  })

  const assetsQuery = useAssets({
    page: currentPage,
    limit: pageSize,
    type: filters.types.length === 1 ? filters.types[0] : undefined,
    category: filters.category,
    tags: filters.tags,
    sortBy,
    sortOrder,
    search: searchQuery || undefined
  })

  // Use search results if searching, otherwise use assets
  const { data, loading, error, meta } = searchQuery ? searchResults : assetsQuery

  const sortOptions = [
    { id: 'createdAt', label: translations.sort.newest, order: 'desc' },
    { id: 'createdAt', label: translations.sort.oldest, order: 'asc' },
    { id: 'title', label: translations.sort.name, order: 'asc' },
    { id: 'downloadCount', label: translations.sort.popular, order: 'desc' }
  ]

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page on new search
  }, [])

  const handleFilterChange = useCallback((newFilters: Omit<typeof filters, 'category'>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1) // Reset to first page on filter change
  }, [])

  const handleSortChange = (optionId: string) => {
    const option = sortOptions.find(o => o.id === optionId)
    if (option) {
      setSortBy(option.id === 'createdAt' && option.order === 'asc' ? 'createdAt' : option.id)
      setSortOrder((option.order || 'desc') as 'asc' | 'desc')
    }
  }

  // FIXED: The useApi hook now preserves both data and meta from API responses
  const assets = Array.isArray(data) ? data : []
  const totalPages = meta?.totalPages || 0

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Frontend received data:', {
      hasData: !!data,
      isArray: Array.isArray(data),
      assetsLength: assets.length,
      dataType: typeof data,
      meta: meta,
      firstAsset: assets[0] ? {
        id: assets[0].id,
        title: assets[0].title,
        type: assets[0].type
      } : 'None'
    })
  }

  // Format assets for AssetCard component
  const formattedAssets = assets.map((asset: any) => ({
    id: asset.id,
    title: asset.title,
    type: asset.type.toLowerCase(),
    thumbnail: asset.thumbnailUrl || '/placeholder.jpg',
    fileSize: formatFileSize(asset.fileSize),
    uploadDate: new Date(asset.createdAt).toLocaleDateString(),
    uploadedBy: asset.uploadedBy?.name || asset.uploadedBy?.email || 'Unknown',
    downloads: asset.downloadCount || 0,
    year: asset.productionYear?.toString() || new Date(asset.createdAt).getFullYear().toString(),
    company: asset.company,
    department: asset.department,
    eventName: asset.eventName,
    usage: asset.usage,
    readyForPublishing: asset.readyForPublishing,
    tags: asset.tags?.map((t: any) => t.name || t) || []
  }))

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {translations.loading || 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">
            {translations.error || 'Failed to load assets'}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {categoryTitle || 'Explore Assets'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Sort dropdown */}
            <Listbox value={sortBy} onChange={handleSortChange}>
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 sm:text-sm">
                  <span className="block truncate">
                    {sortOptions.find(o => o.id === sortBy)?.label || 'Sort'}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-40 overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {sortOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 px-4 ${
                            active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                          }`
                        }
                        value={option.id}
                      >
                        {({ selected }) => (
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {option.label}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>

            {/* Mobile filter button */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              onClick={() => setShowMobileFilters(true)}
            >
              <FunnelIcon className="h-5 w-5" />
              {translations.filters.all}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar
            placeholder={translations.searchPlaceholder}
            onSearch={handleSearch}
          />
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Desktop filters - Sticky sidebar */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-3">
            <div className="sticky top-8">
              <AdvancedFilterSidebar
                onFilterChange={handleFilterChange}
                translations={{ filters: translations.filters }}
                preselectedType={initialType}
              />
            </div>
          </div>

          {/* Asset grid - Better spacing and responsive columns */}
          <div className="lg:col-span-9 xl:col-span-9 mt-8 lg:mt-0">
            {formattedAssets.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {translations.noResults || 'No assets found'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {formattedAssets.map((asset: any) => (
                    <AssetCard
                      key={asset.id}
                      id={asset.id}
                      title={asset.title}
                      type={asset.type}
                      thumbnail={asset.thumbnail}
                      fileSize={asset.fileSize}
                      uploadedBy={asset.uploadedBy}
                      uploadDate={asset.uploadDate}
                      downloads={asset.downloads || 0}
                      year={asset.year || ''}
                      usage={asset.usage || ''}
                      company={asset.company}
                      readyForPublishing={asset.readyForPublishing}
                      allowDownload={canDownload && asset.usage === 'PUBLIC'}
                      lng={lng}
                      translations={translations.actions}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-gray-700 dark:text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile filter modal */}
        <Transition show={showMobileFilters} as={Fragment}>
          <Dialog as="div" className="relative z-50 lg:hidden" onClose={setShowMobileFilters}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 z-50 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {translations.filters.all}
                    </h2>
                    <button
                      type="button"
                      className="ml-3 flex h-10 w-10 items-center justify-center rounded-md bg-white dark:bg-gray-900 p-2 text-gray-400"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Mobile filters */}
                  <div className="mt-4 px-4">
                    <AdvancedFilterSidebar
                      onFilterChange={handleFilterChange}
                      translations={{ filters: translations.filters }}
                      preselectedType={initialType}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition>
      </div>
    </div>
  )
}

// Helper function to format file size
function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let formattedSize = size

  while (formattedSize >= 1024 && i < units.length - 1) {
    formattedSize /= 1024
    i++
  }

  return `${formattedSize.toFixed(1)} ${units[i]}`
}