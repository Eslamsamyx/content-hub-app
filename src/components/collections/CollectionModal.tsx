'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { XMarkIcon, PhotoIcon, LockClosedIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

interface CollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CollectionFormData) => void
  initialData?: CollectionFormData
  isEditing?: boolean
}

interface CollectionFormData {
  name: string
  description: string
  isPrivate: boolean
  tags: string[]
  thumbnail?: File
}

export default function CollectionModal({ isOpen, onClose, onSave, initialData, isEditing = false }: CollectionModalProps) {
  const [formData, setFormData] = useState<CollectionFormData>(
    initialData || {
      name: '',
      description: '',
      isPrivate: false,
      tags: []
    }
  )
  const [tagInput, setTagInput] = useState('')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<CollectionFormData>>({})

  // Reset form when modal opens with different data
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {
        name: '',
        description: '',
        isPrivate: false,
        tags: []
      })
      setErrors({})
      setThumbnailPreview(null)
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validation
    const newErrors: Partial<CollectionFormData> = {}
    if (!formData.name.trim()) newErrors.name = 'Collection name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      onSave(formData)
      setIsLoading(false)
      resetForm()
    }, 1000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isPrivate: false,
      tags: []
    })
    setTagInput('')
    setThumbnailPreview(null)
    setErrors({})
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, thumbnail: file })
      const reader = new FileReader()
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl sm:max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">
              {isEditing ? 'Edit Collection' : 'Create New Collection'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Collection Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/90 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.name ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Enter collection name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white/90 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.description ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none`}
                placeholder="Describe your collection"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Collection Thumbnail (Optional)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center w-full h-32 bg-white/10 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/15 transition-colors relative">
                  {thumbnailPreview ? (
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="w-8 h-8 text-white/50 mx-auto mb-2" />
                      <p className="text-sm text-white/70">Click to upload thumbnail</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Privacy Setting */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-3">
                Privacy Setting
              </label>
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!formData.isPrivate}
                    onChange={() => setFormData({ ...formData, isPrivate: false })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="ml-3 flex items-center">
                    <GlobeAltIcon className="w-5 h-5 text-green-400 mr-2" />
                    <div>
                      <span className="text-white font-medium">Public</span>
                      <p className="text-white/60 text-sm">Anyone in your organization can view</p>
                    </div>
                  </div>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={formData.isPrivate}
                    onChange={() => setFormData({ ...formData, isPrivate: true })}
                    className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 focus:ring-purple-500 focus:ring-2"
                  />
                  <div className="ml-3 flex items-center">
                    <LockClosedIcon className="w-5 h-5 text-orange-400 mr-2" />
                    <div>
                      <span className="text-white font-medium">Private</span>
                      <p className="text-white/60 text-sm">Only you can access this collection</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-white/90 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add tags..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 text-purple-300 text-sm rounded-lg"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-300 hover:text-white"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Collection' : 'Create Collection'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}