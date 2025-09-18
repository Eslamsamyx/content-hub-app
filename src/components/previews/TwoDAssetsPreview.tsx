'use client'

import { useState } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import Image from 'next/image'

interface TwoDAssetsPreviewProps {
  fileUrl: string
  title: string
  dimensions: string
  format: string
}

export default function TwoDAssetsPreview({ fileUrl, title, dimensions, format }: TwoDAssetsPreviewProps) {
  const [backgroundColor, setBackgroundColor] = useState('transparent')
  const [showGrid, setShowGrid] = useState(false)
  const showTransparency = true

  const backgroundOptions = [
    { value: 'transparent', label: 'Transparent', color: 'bg-transparent' },
    { value: 'white', label: 'White', color: 'bg-white' },
    { value: 'black', label: 'Black', color: 'bg-black' },
    { value: 'gray', label: 'Gray', color: 'bg-gray-500' },
  ]

  return (
    <div className="glass rounded-xl p-6">
      {/* Asset Info Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold mb-1">{title}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{dimensions}</span>
            <span>•</span>
            <span>{format.toUpperCase()}</span>
            <span>•</span>
            <span>2D Asset</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Background Color Selector */}
          <div className="flex items-center gap-1 glass rounded-lg p-1">
            {backgroundOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setBackgroundColor(option.value)}
                className={`w-8 h-8 rounded ${option.color} border-2 transition-all ${
                  backgroundColor === option.value ? 'border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                title={option.label}
              >
                {option.value === 'transparent' && (
                  <div className="w-full h-full rounded grid grid-cols-2 grid-rows-2">
                    <div className="bg-gray-300"></div>
                    <div className="bg-gray-400"></div>
                    <div className="bg-gray-400"></div>
                    <div className="bg-gray-300"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 glass rounded-lg transition-colors ${showGrid ? 'bg-white/20' : 'hover:bg-white/10'}`}
            title="Toggle Grid"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main Preview Area */}
      <div className={`relative overflow-hidden rounded-lg ${
        backgroundColor === 'transparent' && showTransparency
          ? 'bg-checkered'
          : backgroundColor === 'white'
          ? 'bg-white'
          : backgroundColor === 'black'
          ? 'bg-black'
          : 'bg-gray-500'
      }`} style={{ height: '600px' }}>
        <TransformWrapper
          initialScale={1}
          initialPositionX={0}
          initialPositionY={0}
          minScale={0.1}
          maxScale={10}
          wheel={{ wheelDisabled: false }}
          pinch={{ disabled: false }}
          doubleClick={{ disabled: false }}
          panning={{ disabled: false }}
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* Zoom Controls */}
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

              {/* Asset Container */}
              <TransformComponent>
                <div className="relative w-full h-[600px] flex items-center justify-center">
                  {showGrid && (
                    <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none">
                      {[...Array(144)].map((_, i) => (
                        <div key={i} className="border border-gray-400/20" />
                      ))}
                    </div>
                  )}
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
      
      {/* Asset Variations/Sizes */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-3">Available Sizes</h3>
        <div className="grid grid-cols-6 gap-2">
          {['@1x', '@2x', '@3x', 'SVG', 'PDF', 'Original'].map((size) => (
            <button
              key={size}
              className="glass rounded-lg p-3 hover:bg-white/10 transition-colors text-center"
            >
              <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">{size}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Asset Details and Actions */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="glass rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Asset Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Type</dt>
              <dd>2D Asset / {format === 'svg' ? 'Vector' : 'Raster'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Color Space</dt>
              <dd>sRGB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">File Size</dt>
              <dd>1.2 MB</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Usage Rights</dt>
              <dd>Internal Use Only</dd>
            </div>
          </dl>
        </div>
        
        <div className="glass rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              Copy Link
            </button>
            <button className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              Copy Embed
            </button>
            <button className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              Edit Metadata
            </button>
            <button className="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              View History
            </button>
          </div>
        </div>
      </div>
      
      {/* Download Options */}
      <div className="mt-6 flex gap-2">
        <button className="flex-1 px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity">
          Download Original
        </button>
        <button className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 16.938 18 17.482 18 18c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

<style jsx>{`
  .bg-checkered {
    background-image: 
      linear-gradient(45deg, #e5e7eb 25%, transparent 25%), 
      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #e5e7eb 75%), 
      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }
  
  .dark .bg-checkered {
    background-image: 
      linear-gradient(45deg, #374151 25%, transparent 25%), 
      linear-gradient(-45deg, #374151 25%, transparent 25%), 
      linear-gradient(45deg, transparent 75%, #374151 75%), 
      linear-gradient(-45deg, transparent 75%, #374151 75%);
  }
`}</style>