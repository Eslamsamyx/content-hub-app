'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import { MagnifyingGlassIcon, Squares2X2Icon, ListBulletIcon, FolderIcon, HeartIcon, ShareIcon, TrashIcon, ChevronDownIcon, PlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { Listbox, Transition } from '@headlessui/react'
import CollectionModal from './CollectionModal'
import { useToast } from '@/contexts/ToastContext'
import { 
  useCollections, 
  usePinCollection, 
  useDeleteCollection,
  useCreateCollection,
  useUpdateCollection
} from '@/hooks/use-api'
import { useSession } from 'next-auth/react'

interface CollectionsContentConnectedProps {
  lng: string
}

const sortOptions = [
  { id: 'newest', name: 'Newest First' },
  { id: 'oldest', name: 'Oldest First' },
  { id: 'name', name: 'Name (A-Z)' },
  { id: 'items', name: 'Most Items' }
]

export default function CollectionsContentConnected({ lng }: CollectionsContentConnectedProps) {
  const { data: session } = useSession()
  const { showSuccess, showError, showInfo } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedSort, setSelectedSort] = useState(sortOptions[0])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<any>(null)
  const [filterPinned, setFilterPinned] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [collectionToDelete, setCollectionToDelete] = useState<any>(null)
  
  // Check if user can create collections (now includes USER role)
  const canCreateCollections = session?.user?.role && 
    ['ADMIN', 'CONTENT_MANAGER', 'CREATIVE', 'USER'].includes(session.user.role)

  // Fetch collections
  const { data: collectionsData, loading, refetch } = useCollections({
    search: searchQuery || undefined
  })

  const { mutate: togglePin } = usePinCollection()
  const { mutate: deleteCollection } = useDeleteCollection()
  const { mutate: createCollection } = useCreateCollection()
  const { mutate: updateCollection } = useUpdateCollection()

  const collections = collectionsData || []

  const handleLikeToggle = async (collectionId: string, isPinned: boolean) => {
    try {
      await togglePin(collectionId)
      showInfo(
        isPinned ? 'Collection Unpinned' : 'Collection Pinned',
        isPinned ? 'Collection removed from favorites.' : 'Collection added to favorites.'
      )
      refetch()
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      showError('Action Failed', 'Failed to update collection status. Please try again.')
    }
  }

  const confirmDelete = (collection: any) => {
    setCollectionToDelete(collection)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!collectionToDelete) return
    
    try {
      await deleteCollection(collectionToDelete.id)
      showSuccess('Collection Deleted', `${collectionToDelete.name} has been permanently deleted.`)
      setShowDeleteModal(false)
      setCollectionToDelete(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete collection:', error)
      showError('Deletion Failed', 'Failed to delete the collection. Please try again.')
    }
  }

  const handleEdit = (collection: any) => {
    setSelectedCollection(collection)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setSelectedCollection(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    console.log('Modal closing, refetching collections...')
    setIsModalOpen(false)
    setSelectedCollection(null)
    // Don't refetch here as we'll do it after successful save
  }

  const handleSaveCollection = async (data: any) => {
    console.log('handleSaveCollection called with data:', data)
    try {
      if (selectedCollection) {
        // Update existing collection
        console.log('Updating collection:', selectedCollection.id)
        const result = await updateCollection({
          id: selectedCollection.id,
          data: {
            name: data.name,
            description: data.description,
            isPublic: !data.isPrivate
          }
        })
        
        console.log('Update result:', result)
        if (result) {
          showSuccess('Collection Updated', `${data.name} has been successfully updated.`)
          handleModalClose()
          await refetch() // Refresh the collections list
        }
      } else {
        // Create new collection
        console.log('Creating new collection with data:', {
          name: data.name,
          description: data.description,
          isPublic: !data.isPrivate
        })
        
        const result = await createCollection({
          name: data.name,
          description: data.description,
          isPublic: !data.isPrivate
        })
        
        console.log('Create collection result:', result)
        if (result) {
          showSuccess('Collection Created', `${data.name} has been successfully created.`)
          handleModalClose()
          await refetch() // Refresh the collections list
        }
      }
    } catch (error: any) {
      console.error('Failed to save collection - Full error:', error)
      
      // Extract error message
      let errorMessage = `Failed to ${selectedCollection ? 'update' : 'create'} the collection.`
      
      if (error?.error?.code === 'FORBIDDEN' || error?.code === 'FORBIDDEN') {
        errorMessage = 'You do not have permission to create collections. Please contact your administrator if you need access.'
      } else if (error?.error?.message || error?.message) {
        errorMessage = error?.error?.message || error?.message
      }
      
      showError(
        selectedCollection ? 'Update Failed' : 'Creation Failed',
        errorMessage
      )
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Collections</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Organize and manage your assets in custom collections
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Filters and Actions */}
        <div className="flex gap-2">
          {/* Pinned Filter */}
          <button
            onClick={() => setFilterPinned(!filterPinned)}
            className={`px-4 py-2 rounded-lg border ${
              filterPinned 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
            }`}
          >
            <HeartIcon className="h-5 w-5" />
          </button>

          {/* Sort */}
          <Listbox value={selectedSort} onChange={setSelectedSort}>
            <div className="relative">
              <Listbox.Button className="relative w-full sm:w-48 pl-3 pr-10 py-2 text-left bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer">
                <span className="block truncate text-gray-900 dark:text-white">{selectedSort.name}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto border border-gray-200 dark:border-gray-700">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `${active ? 'text-white bg-primary' : 'text-gray-900 dark:text-white'}
                        cursor-pointer select-none relative py-2 pl-10 pr-4`
                      }
                      value={option}
                    >
                      {({ selected }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            {option.name}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          {/* View Mode */}
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

          {/* Create New - Only show for users with permission */}
          {canCreateCollections ? (
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">New Collection</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg flex items-center gap-2 cursor-not-allowed"
                 title="You do not have permission to create collections">
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">New Collection</span>
            </div>
          )}
        </div>
      </div>

      {/* Collections */}
      {collections.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No collections</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canCreateCollections 
              ? 'Get started by creating a new collection.'
              : 'No collections available yet.'}
          </p>
          {canCreateCollections && (
            <div className="mt-6">
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                New Collection
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection: any) => (
            <div key={collection.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <Link href={`/${lng}/collections/${collection.id}`}>
                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {collection.thumbnailUrl ? (
                    <ClientImage
                      src={collection.thumbnailUrl}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  {collection.isPrivate && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      Private
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {collection.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {collection.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{collection.assetCount || 0} items</span>
                  <span>{formatDate(collection.updatedAt)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLikeToggle(collection.id, collection.isPinned)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {collection.isPinned ? (
                        <HeartSolidIcon className="h-5 w-5 text-red-500" />
                      ) : (
                        <HeartIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      <ShareIcon className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                  {collection.userId === session?.user?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(collection)}
                        className="text-sm text-primary hover:text-primary-dark"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(collection)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((collection: any) => (
            <div key={collection.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {collection.thumbnailUrl ? (
                      <ClientImage
                        src={collection.thumbnailUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FolderIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link href={`/${lng}/collections/${collection.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary">
                        {collection.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {collection.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{collection.assetCount || 0} items</span>
                      <span>Updated {formatDate(collection.updatedAt)}</span>
                      {collection.isPrivate && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">Private</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLikeToggle(collection.id, collection.isPinned)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {collection.isPinned ? (
                      <HeartSolidIcon className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ShareIcon className="h-5 w-5 text-gray-500" />
                  </button>
                  {collection.userId === session?.user?.id && (
                    <>
                      <button
                        onClick={() => handleEdit(collection)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(collection)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <TrashIcon className="h-5 w-5 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveCollection}
        initialData={selectedCollection ? {
          name: selectedCollection.name,
          description: selectedCollection.description || '',
          isPrivate: !selectedCollection.isPublic,
          tags: []
        } : undefined}
        isEditing={!!selectedCollection}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && collectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete Collection
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {collectionToDelete.name}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Items: <span className="font-medium">{collectionToDelete.assetCount || 0} assets</span>
              </p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>This action cannot be undone. The collection will be permanently deleted.</p>
                    <p className="mt-1">All assets will remain in the system but will no longer be grouped in this collection.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setCollectionToDelete(null)
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}