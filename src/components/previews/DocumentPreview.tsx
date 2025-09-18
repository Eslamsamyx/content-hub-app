'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface DocumentPreviewProps {
  fileUrl: string
  title: string
  format: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DocumentPreview({ fileUrl, title, format }: DocumentPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
  }

  const goToPrevPage = () => setCurrentPage(Math.max(1, currentPage - 1))
  const goToNextPage = () => setCurrentPage(Math.min(numPages || 1, currentPage + 1))

  return (
    <div className="glass rounded-xl p-6">
      {/* Document Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value) || 1
                setCurrentPage(Math.min(Math.max(1, page), numPages || 1))
              }}
              className="w-16 px-2 py-1 glass rounded-lg text-center text-sm"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">/ {numPages || '-'}</span>
          </div>
          
          <button
            onClick={goToNextPage}
            disabled={currentPage === numPages}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          
          <select
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="px-2 py-1 glass rounded-lg text-sm"
          >
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
            <option value="1.75">175%</option>
            <option value="2">200%</option>
          </select>
          
          <button
            onClick={() => setScale(Math.min(3, scale + 0.1))}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          
          {/* Other controls */}
          <button
            onClick={() => setScale(1)}
            className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
            title="Fit to Width"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            </svg>
          </button>
          
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="Download">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>
          
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="Print">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search in document..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-2 pl-10 glass rounded-lg text-sm"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      {/* Document Viewer */}
      <div className="relative overflow-auto bg-gray-100 dark:bg-gray-900 rounded-lg" style={{ height: '700px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass rounded-lg px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span>Loading document...</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('Error loading PDF:', error)
              setIsLoading(false)
            }}
            loading=""
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        </div>
      </div>
      
      {/* Page Thumbnails */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {numPages && [...Array(Math.min(10, numPages))].map((_, index) => {
          const pageNum = index + 1
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden transition-all ${
                currentPage === pageNum 
                  ? 'ring-2 ring-purple-600 ring-offset-2' 
                  : 'hover:opacity-80'
              }`}
            >
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                <span>{pageNum}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                {pageNum}
              </div>
            </button>
          )
        })}
        {numPages && numPages > 10 && (
          <div className="flex-shrink-0 w-20 h-28 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-sm text-gray-500">+{numPages - 10}</span>
          </div>
        )}
      </div>
      
      {/* Document Info */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>Format: {format}</span>
          <span>•</span>
          <span>Size: 2.4 MB</span>
          <span>•</span>
          <span>Modified: 2 days ago</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
            View metadata
          </button>
        </div>
      </div>
    </div>
  )
}