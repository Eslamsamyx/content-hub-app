'use client'

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import Image from 'next/image'

interface ImagePreviewProps {
  fileUrl: string
  title: string
  dimensions: string
}

export default function ImagePreview({ fileUrl, title, dimensions }: ImagePreviewProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        <TransformWrapper
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
          minScale={0.5}
          maxScale={4}
          wheel={{ wheelDisabled: false }}
          pinch={{ disabled: false }}
          doubleClick={{ disabled: false }}
          panning={{ disabled: false }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* Controls */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <button
                  onClick={() => zoomIn()}
                  className="p-2 glass rounded-lg hover:bg-white/20 transition-colors backdrop-blur-md"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={() => zoomOut()}
                  className="p-2 glass rounded-lg hover:bg-white/20 transition-colors backdrop-blur-md"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  onClick={() => resetTransform()}
                  className="p-2 glass rounded-lg hover:bg-white/20 transition-colors backdrop-blur-md"
                  title="Reset"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={() => centerView()}
                  className="p-2 glass rounded-lg hover:bg-white/20 transition-colors backdrop-blur-md"
                  title="Center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
              </div>

              {/* Image Container */}
              <TransformComponent>
                <div className="relative w-full h-[600px] flex items-center justify-center">
                  <Image
                    src={fileUrl}
                    alt={title}
                    width={1920}
                    height={1080}
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                </div>
              </TransformComponent>

              {/* Instructions */}
              <div className="absolute bottom-4 left-4 glass px-4 py-2 rounded-lg backdrop-blur-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Scroll to zoom • Drag to pan • Double-click to reset
                </p>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>
      
      {/* Image Info and Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">Dimensions: {dimensions}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">•</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Click and drag to pan</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="Download Original">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="Share">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 16.938 18 17.482 18 18c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="Open in New Tab">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Additional Image Tools */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <button className="glass rounded-lg p-3 hover:bg-white/10 transition-colors text-center">
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
          </svg>
          <span className="text-xs">Crop</span>
        </button>
        <button className="glass rounded-lg p-3 hover:bg-white/10 transition-colors text-center">
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-xs">Adjust</span>
        </button>
        <button className="glass rounded-lg p-3 hover:bg-white/10 transition-colors text-center">
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs">Rotate</span>
        </button>
        <button className="glass rounded-lg p-3 hover:bg-white/10 transition-colors text-center">
          <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="text-xs">Edit</span>
        </button>
      </div>
    </div>
  )
}