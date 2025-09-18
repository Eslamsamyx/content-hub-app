'use client'

import { useState, Fragment } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { FunnelIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import SearchBar from '@/components/SearchBar'
import AdvancedFilterSidebar from '@/components/AdvancedFilterSidebar'
import AssetCard from '@/components/AssetCard'

interface ExploreContentProps {
  lng: string
  assets: Array<{
    id: string
    title: string
    type: 'video' | 'image' | '3d' | 'design' | 'document' | 'audio' | 'archive' | string
    thumbnail: string
    fileSize: string
    uploadDate: string
    uploadedBy: string
    downloads: number
    year: string
    company?: string
    department?: string
    eventName?: string
    usage?: 'internal' | 'public'
    readyForPublishing?: boolean
    tags?: string[]
  }>
  preselectedCategory?: string
  categoryTitle?: string
  initialType?: string
  translations: {
    searchPlaceholder: string
    filters: {
      all: string
      type: string
      date: string
      department: string
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
  }
}

export default function ExploreContent({ lng, assets, preselectedCategory, categoryTitle, initialType, translations }: ExploreContentProps) {
  const [filteredAssets, setFilteredAssets] = useState(assets)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const sortOptions = [
    { id: 'newest', label: translations.sort.newest },
    { id: 'oldest', label: translations.sort.oldest },
    { id: 'name', label: translations.sort.name },
    { id: 'popular', label: translations.sort.popular }
  ]

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // Filter assets based on search query
    const filtered = assets.filter(asset => 
      asset.title.toLowerCase().includes(query.toLowerCase()) ||
      (asset.company && asset.company.toLowerCase().includes(query.toLowerCase())) ||
      (asset.year && asset.year.includes(query))
    )
    setFilteredAssets(filtered)
  }

  const handleFilterChange = (filters: {
    types: string[]
    eventName: string
    usage: string
    readyForPublishing: boolean
    dateRange: { start: string; end: string } | null
    year: string
    company: string
    tags: string[]
  }) => {
    // Apply filters to assets
    let filtered = assets

    if (filters.types.length > 0 && !(filters.types.length === 1 && filters.types[0] === 'all')) {
      filtered = filtered.filter(asset => filters.types.includes(asset.type))
    }

    if (filters.year && filters.year !== 'all') {
      filtered = filtered.filter(asset => asset.year === filters.year)
    }

    if (filters.company && filters.company !== 'all') {
      filtered = filtered.filter(asset => asset.company === filters.company)
    }

    if (filters.readyForPublishing !== undefined) {
      filtered = filtered.filter(asset => asset.readyForPublishing === filters.readyForPublishing)
    }

    if (filters.eventName && filters.eventName !== 'all') {
      filtered = filtered.filter(asset => asset.eventName === filters.eventName)
    }

    if (filters.usage && filters.usage !== 'all') {
      filtered = filtered.filter(asset => asset.usage === filters.usage)
    }

    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(asset => {
        if (!asset.tags) return false
        // Check if asset has any of the selected tags
        return filters.tags.some(tag => asset.tags?.includes(tag))
      })
    }

    // Apply search query if exists
    if (searchQuery) {
      filtered = filtered.filter(asset => 
        asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.company && asset.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        asset.year.includes(searchQuery) ||
        (asset.department && asset.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredAssets(filtered)
  }

  return (
    <>
      {/* Search Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-6">{categoryTitle || 'Browse Assets'}</h1>
          {preselectedCategory && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Showing all {preselectedCategory} assets
            </p>
          )}
          <SearchBar 
            placeholder={translations.searchPlaceholder}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden px-4 sm:px-6 py-4">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 glass rounded-lg text-sm font-medium hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block">
            <AdvancedFilterSidebar 
              translations={{ filters: translations.filters }}
              onFilterChange={handleFilterChange}
              preselectedType={initialType || preselectedCategory}
            />
          </aside>

          {/* Assets Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAssets.length} assets
              </p>
              <Listbox value={sortBy} onChange={setSortBy}>
                <div className="relative">
                  <Listbox.Button className="relative px-4 py-2 glass rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors w-40">
                    <span className="block truncate">{sortOptions.find(opt => opt.id === sortBy)?.label}</span>
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
                    <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-40 overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                      {sortOptions.map((option) => (
                        <Listbox.Option
                          key={option.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-2 pl-4 pr-4 text-sm ${
                              active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                            }`
                          }
                          value={option.id}
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                {option.label}
                              </span>
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  {...asset}
                  usage={asset.usage || 'internal'}
                  lng={lng}
                  translations={{
                    download: translations.actions.download,
                    preview: translations.actions.preview
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <Transition appear show={showMobileFilters} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={() => setShowMobileFilters(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                  <Dialog.Title
                    as="div"
                    className="flex items-center justify-between mb-4"
                  >
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                      Filters
                    </h3>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </Dialog.Title>
                  
                  <div className="mt-2">
                    <AdvancedFilterSidebar 
                      translations={{ filters: translations.filters }}
                      onFilterChange={handleFilterChange}
                      preselectedType={initialType || preselectedCategory}
                    />
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-lg glass px-4 py-2 text-sm font-medium hover:bg-primary/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      Apply Filters
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}