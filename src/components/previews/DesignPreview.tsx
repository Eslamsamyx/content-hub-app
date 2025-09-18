'use client'

import { useState, Fragment } from 'react'
import Image from 'next/image'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface DesignPreviewProps {
  fileUrl: string
  title: string
  dimensions: string
  layers?: number
}

export default function DesignPreview({ fileUrl, title, dimensions, layers = 24 }: DesignPreviewProps) {
  const [selectedLayer, setSelectedLayer] = useState(0)
  const [showGrid, setShowGrid] = useState(false)
  const [showRulers, setShowRulers] = useState(true)
  const [zoomLevel, setZoomLevel] = useState('100%')
  const [blendMode, setBlendMode] = useState('Normal')

  const zoomOptions = [
    { id: '25%', label: '25%' },
    { id: '50%', label: '50%' },
    { id: '75%', label: '75%' },
    { id: '100%', label: '100%' },
    { id: 'Fit', label: 'Fit' }
  ]

  const blendModes = [
    { id: 'Normal', label: 'Normal' },
    { id: 'Multiply', label: 'Multiply' },
    { id: 'Screen', label: 'Screen' },
    { id: 'Overlay', label: 'Overlay' }
  ]

  return (
    <div className="glass rounded-xl p-6">
      {/* Design Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </button>
          <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 glass rounded-lg transition-colors ${showGrid ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button 
            onClick={() => setShowRulers(!showRulers)}
            className={`p-2 glass rounded-lg transition-colors ${showRulers ? 'bg-white/20' : 'hover:bg-white/10'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">{dimensions}</span>
          <Listbox value={zoomLevel} onChange={setZoomLevel}>
            <div className="relative">
              <Listbox.Button className="relative px-3 py-1.5 glass rounded-lg text-sm cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors w-24">
                <span className="block truncate">{zoomLevel}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-60 w-24 overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                  {zoomOptions.map((option) => (
                    <Listbox.Option
                      key={option.id}
                      className={({ active }) =>
                        `relative cursor-pointer select-none py-1.5 pl-3 pr-3 text-sm ${
                          active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                      value={option.id}
                    >
                      {({ selected }) => (
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {option.label}
                        </span>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>
      
      {/* Design Canvas */}
      <div className="flex gap-4">
        {/* Layers Panel */}
        <div className="w-64 glass rounded-lg p-4">
          <h3 className="font-semibold mb-3">Layers</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {[...Array(layers)].map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedLayer(i)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  selectedLayer === i ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="w-4 h-4"
                />
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm flex-1 text-left">Layer {layers - i}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Main Preview */}
        <div className="flex-1">
          <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            {showRulers && (
              <>
                <div className="absolute top-0 left-8 right-0 h-8 bg-gray-200 dark:bg-gray-700 flex items-end px-2">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="flex-1 border-l border-gray-400 dark:border-gray-600 h-2" />
                  ))}
                </div>
                <div className="absolute top-8 left-0 bottom-0 w-8 bg-gray-200 dark:bg-gray-700 flex flex-col justify-end py-2">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="flex-1 border-t border-gray-400 dark:border-gray-600 w-2" />
                  ))}
                </div>
              </>
            )}
            
            <div className={`relative ${showRulers ? 'ml-8 mt-8' : ''}`}>
              <div className="relative h-[600px]">
                <Image
                  src={fileUrl}
                  alt={title}
                  fill
                  className="object-contain"
                />
                {showGrid && (
                  <div className="absolute inset-0 grid grid-cols-12 grid-rows-12">
                    {[...Array(144)].map((_, i) => (
                      <div key={i} className="border border-gray-300/30 dark:border-gray-600/30" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64 glass rounded-lg p-4">
          <h3 className="font-semibold mb-3">Properties</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Position</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input type="text" value="X: 0" readOnly className="px-2 py-1 glass rounded text-sm" />
                <input type="text" value="Y: 0" readOnly className="px-2 py-1 glass rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Size</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input type="text" value="W: 1920" readOnly className="px-2 py-1 glass rounded text-sm" />
                <input type="text" value="H: 1080" readOnly className="px-2 py-1 glass rounded text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Opacity</label>
              <input type="range" min="0" max="100" value="100" readOnly className="w-full mt-1" />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400">Blend Mode</label>
              <Listbox value={blendMode} onChange={setBlendMode}>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full px-2 py-1 glass rounded text-sm cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors">
                    <span className="block truncate">{blendMode}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                      {blendModes.map((mode) => (
                        <Listbox.Option
                          key={mode.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-1.5 pl-3 pr-3 text-sm ${
                              active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                            }`
                          }
                          value={mode.id}
                        >
                          {({ selected }) => (
                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                              {mode.label}
                            </span>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}