'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import { MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, FolderIcon, HeartIcon, ShareIcon, TrashIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Listbox, Transition } from '@headlessui/react'
import CollectionModal from './CollectionModal'

interface Collection {
  id: string
  name: string
  description: string
  itemCount: number
  thumbnail: string
  isPrivate: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  isLiked: boolean
}

const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Brand Assets',
    description: 'Logo variations, brand guidelines, and marketing materials',
    itemCount: 45,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
    isPrivate: false,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
    tags: ['branding', 'marketing', 'logos'],
    isLiked: true
  },
  {
    id: '2',
    name: 'Product Photography',
    description: 'High-quality product images for e-commerce and catalogs',
    itemCount: 128,
    thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
    isPrivate: false,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    tags: ['photography', 'products', 'e-commerce'],
    isLiked: false
  },
  {
    id: '3',
    name: 'Social Media Templates',
    description: 'Ready-to-use templates for Instagram, Facebook, and Twitter',
    itemCount: 32,
    thumbnail: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    isPrivate: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-22',
    tags: ['templates', 'social-media', 'design'],
    isLiked: true
  },
  {
    id: '4',
    name: 'Event Photography',
    description: 'Photos from company events, conferences, and team activities',
    itemCount: 89,
    thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop',
    isPrivate: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-18',
    tags: ['events', 'photography', 'corporate'],
    isLiked: false
  },
  {
    id: '5',
    name: 'Video Content',
    description: 'Marketing videos, tutorials, and promotional content',
    itemCount: 23,
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=300&fit=crop',
    isPrivate: true,
    createdAt: '2023-12-28',
    updatedAt: '2024-01-21',
    tags: ['video', 'marketing', 'tutorials'],
    isLiked: true
  },
  {
    id: '6',
    name: 'Web Assets',
    description: 'Icons, illustrations, and graphics for web development',
    itemCount: 76,
    thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop',
    isPrivate: false,
    createdAt: '2023-12-20',
    updatedAt: '2024-01-19',
    tags: ['web', 'icons', 'illustrations'],
    isLiked: false
  }
]

const viewTypes = [
  { id: 'grid', name: 'Grid', icon: Squares2X2Icon },
  { id: 'list', name: 'List', icon: ListBulletIcon }
]

const sortOptions = [
  { id: 'name', name: 'Name' },
  { id: 'date', name: 'Date Modified' },
  { id: 'size', name: 'Item Count' },
  { id: 'created', name: 'Date Created' }
]

const filterOptions = [
  { id: 'all', name: 'All Collections' },
  { id: 'public', name: 'Public' },
  { id: 'private', name: 'Private' },
  { id: 'liked', name: 'Liked' }
]

export default function CollectionsContent({ lng }: { lng: string }) {
  const [collections, setCollections] = useState<Collection[]>(mockCollections)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewType, setViewType] = useState('grid')
  const [sortBy, setSortBy] = useState('date')
  const [filterBy, setFilterBy] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         collection.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesFilter = filterBy === 'all' || 
                         (filterBy === 'public' && !collection.isPrivate) ||
                         (filterBy === 'private' && collection.isPrivate) ||
                         (filterBy === 'liked' && collection.isLiked)
    
    return matchesSearch && matchesFilter
  })

  const sortedCollections = [...filteredCollections].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'size':
        return b.itemCount - a.itemCount
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })

  const handleLike = (collectionId: string) => {
    setCollections(collections.map(collection =>
      collection.id === collectionId
        ? { ...collection, isLiked: !collection.isLiked }
        : collection
    ))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">My Collections</h1>
        <p className="text-white/70 text-lg">Organize and manage your content collections</p>
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
              placeholder="Search by name, description, or tags..."
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
          {searchQuery && (
            <div className="absolute mt-2 text-sm text-white/60">
              {filteredCollections.length} {filteredCollections.length === 1 ? 'collection' : 'collections'} found
            </div>
          )}
        </div>

        {/* Filter */}
        <Listbox value={filterBy} onChange={setFilterBy}>
          <div className="relative">
            <Listbox.Button className="relative w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm cursor-pointer">
              <span className="block truncate">
                {filterOptions.find(option => option.id === filterBy)?.name}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="w-5 h-5 text-white/70" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-2 w-full bg-gray-800 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                {filterOptions.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-3 px-4 ${
                        active ? 'bg-white/10 text-white' : 'text-white/80'
                      }`
                    }
                    value={option.id}
                  >
                    {({ selected }) => (
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        {option.name}
                      </span>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {/* Sort */}
        <Listbox value={sortBy} onChange={setSortBy}>
          <div className="relative">
            <Listbox.Button className="relative w-full px-4 py-3 pr-10 bg-white/10 border border-white/20 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm cursor-pointer">
              <span className="block truncate">
                Sort by {sortOptions.find(option => option.id === sortBy)?.name}
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="w-5 h-5 text-white/70" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute mt-2 w-full bg-gray-800 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                {sortOptions.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-3 px-4 ${
                        active ? 'bg-white/10 text-white' : 'text-white/80'
                      }`
                    }
                    value={option.id}
                  >
                    {({ selected }) => (
                      <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                        Sort by {option.name}
                      </span>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>

        {/* View Type */}
        <div className="flex bg-white/10 border border-white/20 rounded-xl backdrop-blur-sm">
          {viewTypes.map(view => (
            <button
              key={view.id}
              onClick={() => setViewType(view.id)}
              className={`p-3 rounded-lg transition-colors ${
                viewType === view.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title={view.name}
            >
              <view.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

      </div>

      {/* Collections Grid */}
      {viewType === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCollections.map(collection => (
            <Link key={collection.id} href={`/${lng}/collections/${collection.id}`} className="group block">
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <ClientImage
                    src={collection.thumbnail}
                    alt={collection.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleLike(collection.id)}
                      className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      {collection.isLiked ? (
                        <HeartSolidIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <HeartIcon className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors">
                      <ShareIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>

                  {/* Privacy Badge */}
                  {collection.isPrivate && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 bg-orange-500/80 text-white text-xs font-medium rounded-lg backdrop-blur-sm">
                        Private
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {collection.name}
                    </h3>
                    <FolderIcon className="w-5 h-5 text-white/50 flex-shrink-0 ml-2" />
                  </div>
                  
                  <p className="text-white/70 text-sm mb-4 line-clamp-2">
                    {collection.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-white/60 mb-3">
                    <span>{collection.itemCount} items</span>
                    <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {collection.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                    {collection.tags.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 text-white/80 text-xs rounded-lg">
                        +{collection.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Collections List */}
      {viewType === 'list' && (
        <div className="space-y-4">
          {sortedCollections.map(collection => (
            <Link key={collection.id} href={`/${lng}/collections/${collection.id}`} className="block backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="flex items-center gap-6">
                {/* Thumbnail */}
                <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <ClientImage
                    src={collection.thumbnail}
                    alt={collection.name}
                    fill
                    className="object-cover"
                  />
                  {collection.isPrivate && (
                    <div className="absolute top-1 left-1">
                      <span className="px-1 py-0.5 bg-orange-500/80 text-white text-xs font-medium rounded backdrop-blur-sm">
                        Private
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLike(collection.id)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {collection.isLiked ? (
                          <HeartSolidIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <HeartIcon className="w-4 h-4 text-white/70" />
                        )}
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <ShareIcon className="w-4 h-4 text-white/70" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-white/70 text-sm mb-3">
                    {collection.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span>{collection.itemCount} items</span>
                      <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {collection.tags.slice(0, 3).map(tag => (
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
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {sortedCollections.length === 0 && (
        <div className="text-center py-16">
          <FolderIcon className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No collections found</h3>
          <p className="text-white/70 mb-6">
            {searchQuery ? 'Try adjusting your search or filters' : 'Create your first collection to get started'}
          </p>
        </div>
      )}

      {/* Collection Modal */}
      {showModal && (
        <CollectionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={(collectionData) => {
            console.log('New collection:', collectionData)
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}