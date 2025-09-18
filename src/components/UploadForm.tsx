'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

interface UploadFormProps {
  lng: string
}

interface FileWithPreview extends File {
  preview?: string
}

const assetCategories = [
  { id: 'video', name: 'Video' },
  { id: 'image', name: 'Image' },
  { id: '3d', name: '3D Model' },
  { id: 'design', name: 'Design' },
  { id: 'audio', name: 'Audio' },
  { id: 'document', name: 'Document' },
]

const departments = [
  'Marketing',
  'Creative',
  'Product',
  'Engineering',
  'Sales',
  'HR',
  'Finance',
  'Operations'
]

export default function UploadForm({ }: UploadFormProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department: '',
    tags: '',
    productionYear: new Date().getFullYear().toString(),
    readyForPublishing: false,
    usage: 'internal' as 'internal' | 'public'
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'application/pdf': ['.pdf'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  })

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles(files.filter(file => file !== fileToRemove))
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate upload progress
    files.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 200)
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Drag and Drop Zone */}
        <div
          {...getRootProps()}
          className={`relative group cursor-pointer transition-all duration-300 ${
            isDragActive ? 'scale-[1.02]' : ''
          }`}
        >
          <input {...getInputProps()} />
          
          {/* Background effects */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300 ${
            isDragActive ? 'opacity-40' : ''
          }`} />
          
          {/* Main drop zone */}
          <div className={`relative bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-3xl border-2 border-dashed ${
            isDragActive ? 'border-primary' : 'border-white/20 dark:border-white/10'
          } p-12 text-center transition-all duration-300 hover:border-white/30 dark:hover:border-white/20`}>
            
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Text */}
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              {isDragActive ? 'Drop your files here' : 'Drag & drop your assets'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or <span className="text-primary font-medium cursor-pointer hover:underline">browse files</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports: Images, Videos, 3D Models, Audio, Documents • Max 50MB per file
            </p>
          </div>
        </div>

        {/* Files Preview */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Selected Files</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="relative overflow-hidden rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex items-center space-x-4">
                      {/* File icon/preview */}
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                        {file.type.startsWith('image/') && file.preview ? (
                          <Image src={file.preview} alt={file.name} fill className="object-cover rounded-lg" />
                        ) : (
                          <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      
                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        
                        {/* Upload progress */}
                        {uploadProgress[file.name] !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Remove button */}
                      {!uploadProgress[file.name] && (
                        <button
                          type="button"
                          onClick={() => removeFile(file)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-red-500/10"
                        >
                          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Form */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Asset Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                placeholder="Enter asset title"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                placeholder="Describe your asset"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                required
              >
                <option value="">Select category</option>
                {assetCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-2">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Production Year */}
            <div>
              <label className="block text-sm font-medium mb-2">Production Year</label>
              <input
                type="number"
                value={formData.productionYear}
                onChange={(e) => setFormData({ ...formData, productionYear: e.target.value })}
                min="2000"
                max={new Date().getFullYear()}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                placeholder="design, marketing, 2024"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>

            {/* Usage Rights */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-4">Usage Rights</label>
              <div className="flex gap-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="usage"
                    value="internal"
                    checked={formData.usage === 'internal'}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value as 'internal' | 'public' })}
                    className="w-4 h-4 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm">Internal Use Only</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="usage"
                    value="public"
                    checked={formData.usage === 'public'}
                    onChange={(e) => setFormData({ ...formData, usage: e.target.value as 'internal' | 'public' })}
                    className="w-4 h-4 text-primary focus:ring-primary/20"
                  />
                  <span className="text-sm">Public Use Allowed</span>
                </label>
              </div>
            </div>

            {/* Ready for Publishing */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.readyForPublishing}
                  onChange={(e) => setFormData({ ...formData, readyForPublishing: e.target.checked })}
                  className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                />
                <span className="text-sm font-medium">Ready for Publishing</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">Check this if the asset is finalized and approved</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={files.length === 0 || !formData.title || !formData.category}
            className="relative group px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-xl hover:shadow-primary/25"
          >
            <span className="relative z-10">Upload Assets</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-50 group-hover:opacity-70 transition-opacity duration-200" />
          </button>
        </div>
      </form>
    </div>
  )
}