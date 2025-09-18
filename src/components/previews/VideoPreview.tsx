'use client'

import { useState, Fragment } from 'react'
import dynamic from 'next/dynamic'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface VideoPreviewProps {
  fileUrl: string
  thumbnail: string
  title: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function VideoPreview({ fileUrl, thumbnail, title }: VideoPreviewProps) {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [playedSeconds, setPlayedSeconds] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [quality, setQuality] = useState('Auto')

  const playbackRateOptions = [
    { id: 0.5, label: '0.5x' },
    { id: 1, label: '1x' },
    { id: 1.25, label: '1.25x' },
    { id: 1.5, label: '1.5x' },
    { id: 2, label: '2x' }
  ]

  const qualityOptions = [
    { id: 'Auto', label: 'Auto' },
    { id: '1080p', label: '1080p' },
    { id: '720p', label: '720p' },
    { id: '480p', label: '480p' },
    { id: '360p', label: '360p' }
  ]

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000)
    const hh = date.getUTCHours()
    const mm = date.getUTCMinutes()
    const ss = date.getSeconds().toString().padStart(2, '0')
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`
    }
    return `${mm}:${ss}`
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="aspect-video relative overflow-hidden rounded-lg bg-black">
        <ReactPlayer
          {...{
            url: fileUrl,
            playing,
            volume,
            playbackRate,
            width: "100%",
            height: "100%",
            light: thumbnail,
            controls: false,
            onProgress: (state: any) => setPlayedSeconds(state.playedSeconds),
            onDuration: (duration: number) => setDuration(duration)
          } as any}
        />
      </div>
      
      {/* Custom Video Controls */}
      <div className="mt-4 space-y-4">
        {/* Progress Bar */}
        <div className="relative">
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full gradient-bg transition-all duration-300"
              style={{ width: `${duration ? (playedSeconds / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
            <span>{formatTime(playedSeconds)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={() => setPlaying(!playing)}
              className="p-2 gradient-bg rounded-lg hover:opacity-90 transition-opacity"
            >
              {playing ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>

            {/* Playback Speed */}
            <Listbox value={playbackRate} onChange={setPlaybackRate}>
              <div className="relative">
                <Listbox.Button className="relative px-2 py-1 glass rounded-lg text-sm cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors w-16">
                  <span className="block truncate">{playbackRateOptions.find(opt => opt.id === playbackRate)?.label}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                    <ChevronDownIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-16 overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                    {playbackRateOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-1 pl-2 pr-2 text-sm ${
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

          <div className="flex items-center gap-2">
            {/* Picture in Picture */}
            <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>

            {/* Fullscreen */}
            <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quality Settings */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">Quality:</span>
            <Listbox value={quality} onChange={setQuality}>
              <div className="relative">
                <Listbox.Button className="relative px-2 py-1 glass rounded-lg text-sm cursor-pointer hover:bg-white/20 dark:hover:bg-black/20 transition-colors w-20">
                  <span className="block truncate">{quality}</span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1">
                    <ChevronDownIcon className="h-3 w-3 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-20 overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                    {qualityOptions.map((option) => (
                      <Listbox.Option
                        key={option.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-1 pl-2 pr-2 text-sm ${
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
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              Captions
            </button>
            <button className="px-3 py-1 glass rounded-lg hover:bg-white/10 transition-colors text-sm">
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}