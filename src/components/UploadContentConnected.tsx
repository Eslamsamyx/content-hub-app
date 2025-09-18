'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { useToast } from '@/contexts/ToastContext'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { useTags } from '@/hooks/use-api'
import TagInput from '@/components/TagInput'

interface UploadContentConnectedProps {
  lng: string
  translations: {
    title: string
    subtitle: string
    dropzone: {
      title: string
      subtitle: string
      browse: string
    }
    form: {
      title: string
      description: string
      category: string
      tags: string
      company: string
      eventName: string
      project: string
      campaign: string
      year: string
      usage: string
      readyForPublishing: string
      submitReview: string
    }
    buttons: {
      upload: string
      cancel: string
      uploading: string
      remove: string
    }
    status: {
      uploading: string
      processing: string
      complete: string
      failed: string
    }
    categories: Record<string, string>
    usage: {
      internal: string
      public: string
    }
  }
}

interface FileUpload {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed'
  progress: number
  error?: string
  metadata?: any
  uploadUrl?: string
  fileKey?: string
}

export default function UploadContentConnected({ lng, translations }: UploadContentConnectedProps) {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // Using direct API calls instead of hooks for upload
  // const { mutate: prepareUpload } = useUploadAsset()
  // const { mutate: completeUpload } = useCompleteUpload()
  const { data: tagsData } = useTags()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending' as const,
      progress: 0,
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: '',
        tags: [],
        company: '',
        eventName: '',
        project: '',
        campaign: '',
        productionYear: new Date().getFullYear(),
        usage: 'internal',
        readyForPublishing: false,
        submitForReview: false
      }
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.flac', '.aac'],
      'application/pdf': ['.pdf'],
      'application/vnd.*': ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      'model/*': ['.obj', '.fbx', '.gltf', '.glb'],
      'application/x-*': ['.psd', '.ai', '.sketch', '.fig']
    }
  })

  const updateFileMetadata = (fileId: string, metadata: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, metadata: { ...f.metadata, ...metadata } } : f
    ))
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const uploadFile = async (fileUpload: FileUpload) => {
    try {
      console.log('Starting upload for:', fileUpload.file.name)
      
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { ...f, status: 'uploading', progress: 10 } : f
      ))

      // Step 1: Get presigned URL
      console.log('Step 1: Getting presigned URL...')
      // Prepare upload using direct API call
      const prepareResponse = await fetch('/api/assets/upload/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: fileUpload.file.name,
          fileSize: fileUpload.file.size,
          fileType: fileUpload.file.type
        })
      }).then(res => res.json())

      const { uploadUrl, fileKey, uploadId } = prepareResponse
      console.log('Got presigned URL:', { uploadId, fileKey, uploadUrl: uploadUrl?.substring(0, 100) + '...' })

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { ...f, progress: 30, uploadUrl, fileKey } : f
      ))

      // Step 2: Upload to S3
      console.log('Step 2: Uploading to S3...')
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: fileUpload.file,
        headers: {
          'Content-Type': fileUpload.file.type
        }
      })

      console.log('S3 upload response:', uploadResponse.status, uploadResponse.statusText)
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('S3 upload failed:', errorText)
        throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${errorText}`)
      }
      
      console.log('S3 upload successful!')

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { ...f, status: 'processing', progress: 70 } : f
      ))

      // Step 3: Complete upload
      console.log('Step 3: Completing upload...')
      const completePayload = {
        uploadId,
        fileKey,
        metadata: fileUpload.metadata, // metadata contains title, description, category, tags, etc.
        fileSize: fileUpload.file.size,
        mimeType: fileUpload.file.type,
        originalFilename: fileUpload.file.name
      }
      console.log('Complete upload payload:', completePayload)
      
      // Complete upload using direct API call
      const completeResponse = await fetch('/api/assets/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completePayload)
      }).then(res => res.json())

      // Update status to complete
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { ...f, status: 'complete', progress: 100 } : f
      ))
      
      showSuccess('Upload Complete', `${fileUpload.file.name} has been successfully uploaded.`)
      console.log('Upload completed successfully for:', fileUpload.file.name)

      return completeResponse
    } catch (error: any) {
      console.error('Upload failed:', error)
      // Update status to failed
      const errorMessage = error.message || 'Upload failed'
      setFiles(prev => prev.map(f => 
        f.id === fileUpload.id ? { 
          ...f, 
          status: 'failed', 
          error: errorMessage 
        } : f
      ))
      showError('Upload Failed', `Failed to upload ${fileUpload.file.name}: ${errorMessage}`)
      throw error
    }
  }

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file)
      }

      // Show success message
      const uploadCount = pendingFiles.length
      showInfo(
        'All Uploads Complete', 
        `Successfully uploaded ${uploadCount} ${uploadCount === 1 ? 'file' : 'files'}. Redirecting to library...`
      )
      setTimeout(() => {
        router.push(`/${lng}/library`)
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
      showWarning('Upload Process Incomplete', 'Some files may have failed to upload. Please check the status of each file.')
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0]
    switch (type) {
      case 'image': return PhotoIcon
      case 'video': return VideoCameraIcon
      case 'audio': return MusicalNoteIcon
      case 'application':
        if (file.name.endsWith('.pdf')) return DocumentIcon
        if (file.name.match(/\.(psd|ai|sketch|fig)$/)) return PaintBrushIcon
        return DocumentIcon
      case 'model': return CubeIcon
      default: return DocumentIcon
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {translations.title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {translations.subtitle}
          </p>
        </div>

        {/* Dropzone */}
        {files.length === 0 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-900 dark:text-white">
              {translations.dropzone.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {translations.dropzone.subtitle}
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {translations.dropzone.browse}
            </button>
          </div>
        )}

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-4">
            {files.map((fileUpload) => {
              const Icon = getFileIcon(fileUpload.file)
              return (
                <div
                  key={fileUpload.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Icon className="h-10 w-10 text-gray-400 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {fileUpload.file.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Upload status */}
                        {fileUpload.status !== 'pending' && (
                          <div className="mt-2">
                            {fileUpload.status === 'uploading' && (
                              <div className="flex items-center">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${fileUpload.progress}%` }}
                                  />
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                  {fileUpload.progress}%
                                </span>
                              </div>
                            )}
                            {fileUpload.status === 'processing' && (
                              <p className="text-sm text-blue-600">
                                {translations.status.processing}
                              </p>
                            )}
                            {fileUpload.status === 'complete' && (
                              <p className="text-sm text-green-600 flex items-center">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                {translations.status.complete}
                              </p>
                            )}
                            {fileUpload.status === 'failed' && (
                              <p className="text-sm text-red-600 flex items-center">
                                <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                                {fileUpload.error || translations.status.failed}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Metadata form (only for pending files) */}
                        {fileUpload.status === 'pending' && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translations.form.title}
                              </label>
                              <input
                                type="text"
                                value={fileUpload.metadata.title}
                                onChange={(e) => updateFileMetadata(fileUpload.id, { title: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translations.form.category}
                              </label>
                              <select
                                value={fileUpload.metadata.category}
                                onChange={(e) => updateFileMetadata(fileUpload.id, { category: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm sm:text-sm"
                              >
                                <option value="">Select a category</option>
                                {Object.entries(translations.categories).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translations.form.description}
                              </label>
                              <textarea
                                value={fileUpload.metadata.description}
                                onChange={(e) => updateFileMetadata(fileUpload.id, { description: e.target.value })}
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translations.form.usage}
                              </label>
                              <select
                                value={fileUpload.metadata.usage}
                                onChange={(e) => updateFileMetadata(fileUpload.id, { usage: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm sm:text-sm"
                              >
                                <option value="internal">{translations.usage.internal}</option>
                                <option value="public">{translations.usage.public}</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {translations.form.tags}
                              </label>
                              <TagInput
                                value={fileUpload.metadata.tags || []}
                                onChange={(tags) => updateFileMetadata(fileUpload.id, { tags })}
                                suggestions={(() => {
                                  if (!tagsData?.tags) return []
                                  // If tags is an array, use it directly
                                  if (Array.isArray(tagsData.tags)) {
                                    return tagsData.tags.map((t: any) => t.name || t)
                                  }
                                  // If tags is grouped by category (object), flatten all categories
                                  const allTags: string[] = []
                                  Object.values(tagsData.tags).forEach((categoryTags: any) => {
                                    if (Array.isArray(categoryTags)) {
                                      categoryTags.forEach((tag: any) => {
                                        allTags.push(tag.name || tag)
                                      })
                                    }
                                  })
                                  return allTags
                                })()}
                                placeholder="Add tags..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={fileUpload.metadata.readyForPublishing}
                                  onChange={(e) => updateFileMetadata(fileUpload.id, { readyForPublishing: e.target.checked })}
                                  className="rounded border-gray-300 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                  {translations.form.readyForPublishing}
                                </span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={fileUpload.metadata.submitForReview}
                                  onChange={(e) => updateFileMetadata(fileUpload.id, { submitForReview: e.target.checked })}
                                  className="rounded border-gray-300 dark:border-gray-600"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                  {translations.form.submitReview}
                                </span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {fileUpload.status === 'pending' && (
                      <button
                        onClick={() => removeFile(fileUpload.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Add more files button */}
            {!isUploading && (
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400"
              >
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drop more files here or click to browse
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push(`/${lng}/library`)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {translations.buttons.cancel}
              </button>
              <button
                onClick={handleUploadAll}
                disabled={isUploading || files.filter(f => f.status === 'pending').length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? translations.buttons.uploading : translations.buttons.upload}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}