'use client'

import React, { useState, useRef } from 'react'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: any
}

export default function SimpleUpload() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = Array.from(selectedFiles).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0
    }))
    setFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    const formData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('tags', tags)
    formData.append('description', description)

    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, progress: percentComplete }
                : f
            ))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = JSON.parse(xhr.responseText)
            console.log('✅ Upload successful:', result)
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100, result: result.data }
                : f
            ))
            resolve(result)
          } else {
            const error = JSON.parse(xhr.responseText)
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'error', error: error.message }
                : f
            ))
            reject(new Error(error.message))
          }
        })

        xhr.addEventListener('error', () => {
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ))
          reject(new Error('Upload failed'))
        })

        xhr.open('POST', '/api/assets/upload/direct')
        xhr.send(formData)
      })

      await uploadPromise
      setMessage({ type: 'success', text: `${uploadFile.file.name} uploaded successfully` })
      setTimeout(() => setMessage(null), 5000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setMessage({ type: 'error', text: error.message })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const uploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    for (const file of pendingFiles) {
      await uploadFile(file)
    }
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      case 'success':
        return <span className="text-green-500">✓</span>
      case 'error':
        return <span className="text-red-500">✗</span>
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Simple File Upload</h2>
      </div>
      <div className="p-6 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Upload Area */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const files = e.dataTransfer.files
            if (files) handleFileSelect(files)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="text-6xl mb-4">📁</div>
          <p className="text-lg font-medium text-gray-600 mb-2">
            Click or drag files here to upload
          </p>
          <p className="text-sm text-gray-400">
            Supports images, videos, documents, and more
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files
            if (files) handleFileSelect(files)
          }}
        />

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., marketing, presentation, 2024"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{file.progress}%</span>
                    </div>
                  )}
                  {file.error && (
                    <p className="text-xs text-red-500 mt-1">{file.error}</p>
                  )}
                  {file.status === 'success' && file.result && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-green-600 font-medium">✅ Upload successful!</p>
                      <div className="space-x-3 text-xs">
                        <a 
                          href={file.result.directUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          📁 Direct Link
                        </a>
                        <a 
                          href={file.result.downloadUrl} 
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          ⬇️ Download
                        </a>
                        <span className="text-gray-500">ID: {file.result.id}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(file.status)}
                  <button
                    className="text-gray-400 hover:text-red-500 p-1"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'uploading'}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="flex justify-end">
            <button 
              onClick={uploadAll}
              disabled={files.some(f => f.status === 'uploading') || files.every(f => f.status === 'success')}
              className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Upload {files.filter(f => f.status === 'pending').length} Files
            </button>
          </div>
        )}
      </div>
    </div>
  )
}