'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeftIcon, 
  PhotoIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  BookmarkIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useCollection, useUpdateCollection, useDeleteCollection } from '@/hooks/use-api'
import { useToast } from '@/contexts/ToastContext'

interface EditCollectionContentProps {
  lng: string
  collectionId: string
}

export default function EditCollectionContent({ 
  lng, 
  collectionId 
}: EditCollectionContentProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { showSuccess, showError, showWarning } = useToast()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch collection details
  const { data: collection, loading, error } = useCollection(collectionId)
  const { mutate: updateCollection } = useUpdateCollection()
  const { mutate: deleteCollection } = useDeleteCollection()

  // Check if user is the owner
  const isOwner = collection && session?.user?.id === collection.createdBy?.id
  const isAdmin = session?.user?.role === 'ADMIN'
  const canEdit = isOwner || isAdmin

  // Initialize form with collection data
  useEffect(() => {
    if (collection) {
      setName(collection.name || '')
      setDescription(collection.description || '')
      setIsPublic(collection.isPublic || false)
      setIsPinned(collection.isPinned || false)
      setCoverImagePreview(collection.coverImage || null)
    }
  }, [collection])

  // Redirect if not authorized
  useEffect(() => {
    if (!loading && collection && !canEdit) {
      showError('Unauthorized', 'You do not have permission to edit this collection.')
      router.push(`/${lng}/collections/${collectionId}`)
    }
  }, [loading, collection, canEdit, router, lng, collectionId, showError])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showWarning('File Too Large', 'Cover image must be less than 5MB.')
        return
      }
      
      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      showWarning('Name Required', 'Please enter a collection name.')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Prepare update data
      const updateData: any = {
        name: name.trim(),
        description: description.trim(),
        isPublic,
        isPinned
      }

      // Handle cover image upload if changed
      if (coverImage) {
        // TODO: Upload image to S3 and get key
        // For now, we'll skip image upload
        showWarning('Image Upload', 'Cover image upload is not yet implemented.')
      }

      await updateCollection({ id: collectionId, data: updateData })
      showSuccess('Collection Updated', 'Your collection has been successfully updated.')
      router.push(`/${lng}/collections/${collectionId}`)
    } catch (error) {
      console.error('Failed to update collection:', error)
      showError('Update Failed', 'Failed to update the collection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCollection(collectionId)
      showSuccess('Collection Deleted', 'The collection has been permanently deleted.')
      router.push(`/${lng}/collections`)
    } catch (error) {
      console.error('Failed to delete collection:', error)
      showError('Deletion Failed', 'Failed to delete the collection. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded-lg w-1/4 mb-8"></div>
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-6">
                <div className="h-10 bg-white/10 rounded-lg"></div>
                <div className="h-32 bg-white/10 rounded-lg"></div>
                <div className="h-10 bg-white/10 rounded-lg w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto text-center py-12">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">Collection Not Found</h3>
              <p className="text-white/60 mb-8">
                The collection you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Link
                href={`/${lng}/collections`}
                className="inline-flex items-center px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Back to Collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/${lng}/collections/${collectionId}`}
              className="inline-flex items-center text-white/70 hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Collection
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Edit Collection</h1>
            <p className="text-white/60">
              Update your collection details and settings
            </p>
          </div>

          {/* Glass morphism form container */}
          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 space-y-6">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter collection name"
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/90 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Add a description for your collection"
                disabled={isSubmitting}
              />
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Cover Image
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                {coverImagePreview ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="h-32 w-48 object-cover rounded-xl border border-white/20"
                      suppressHydrationWarning
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null)
                        setCoverImagePreview(null)
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={isSubmitting}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-colors group">
                    <PhotoIcon className="h-8 w-8 text-white/50 group-hover:text-white/70 transition-colors" />
                    <span className="mt-2 text-sm text-white/50 group-hover:text-white/70 transition-colors">Upload Image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={isSubmitting}
                    />
                  </label>
                )}
                <div className="text-xs text-white/50 space-y-1">
                  <p>Recommended: 1200x630px</p>
                  <p>Max size: 5MB</p>
                  <p>Formats: JPG, PNG, GIF</p>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <label className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mt-0.5 h-5 w-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  disabled={isSubmitting}
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    {isPublic ? (
                      <GlobeAltIcon className="h-5 w-5 text-green-400 mr-2" />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-yellow-400 mr-2" />
                    )}
                    <span className="text-white font-medium">
                      {isPublic ? 'Public Collection' : 'Private Collection'}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm mt-1">
                    {isPublic 
                      ? 'Anyone in your organization can view this collection' 
                      : 'Only you can view this collection'}
                  </p>
                </div>
              </label>

              {(isOwner || isAdmin) && (
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="mt-0.5 h-5 w-5 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                    disabled={isSubmitting}
                  />
                  <div className="ml-3">
                    <div className="flex items-center">
                      <BookmarkIcon className="h-5 w-5 text-purple-400 mr-2" />
                      <span className="text-white font-medium">Pin Collection</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      Pin this collection to the top of your collections list
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-white/10 gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-red-500/50 text-red-400 rounded-xl font-medium hover:bg-red-500/10 hover:border-red-500 transition-all duration-200"
                disabled={isSubmitting}
              >
                <TrashIcon className="mr-2 h-5 w-5" />
                Delete Collection
              </button>

              <div className="flex w-full sm:w-auto gap-3">
                <Link
                  href={`/${lng}/collections/${collectionId}`}
                  className="flex-1 sm:flex-initial px-6 py-3 border border-white/20 text-white/70 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all duration-200 text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="mr-2 h-5 w-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowDeleteModal(false)} 
            />

            <div className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-white/20">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Delete Collection
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-white/70">
                      Are you sure you want to delete &quot;{collection.name}&quot;? This action cannot be undone and all references to this collection will be removed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-xl px-4 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto transition-colors"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-white/20 px-4 py-2.5 bg-white/10 text-white font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}