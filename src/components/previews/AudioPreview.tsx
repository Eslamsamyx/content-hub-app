'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type WaveSurfer from 'wavesurfer.js'
import Image from 'next/image'

const WavesurferPlayer = dynamic(
  () => import('@wavesurfer/react').then((mod) => mod.default),
  { ssr: false }
)

interface AudioPreviewProps {
  fileUrl: string
  thumbnail: string
  title: string
  duration?: string
}

export default function AudioPreview({ fileUrl, thumbnail, title }: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const onReady = (ws: WaveSurfer) => {
    setWavesurfer(ws)
    setIsPlaying(false)
    setIsLoading(false)
    setTotalDuration(ws.getDuration())
  }

  const onPlayPause = () => {
    if (wavesurfer) {
      wavesurfer.playPause()
      setIsPlaying(wavesurfer.isPlaying())
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (wavesurfer) {
      wavesurfer.setVolume(newVolume)
    }
  }

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (wavesurfer) {
      wavesurfer.setPlaybackRate(rate)
    }
  }

  const skipBackward = () => {
    if (wavesurfer) {
      wavesurfer.skip(-10)
    }
  }

  const skipForward = () => {
    if (wavesurfer) {
      wavesurfer.skip(10)
    }
  }

  return (
    <div className="glass rounded-xl p-6">
      {/* Album Art with Animated Background */}
      <div className="relative max-w-md mx-auto mb-6">
        <div className="aspect-square relative overflow-hidden rounded-lg shadow-2xl">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className={`object-cover transition-transform duration-300 ${isPlaying ? 'scale-105' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Play/Pause Overlay */}
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="p-4 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              {isPlaying ? (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>
      
      {/* Audio Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">Audio File</p>
      </div>
      
      {/* Waveform */}
      <div className="mb-6 rounded-lg overflow-hidden glass p-4">
        <WavesurferPlayer
          url={fileUrl}
          height={100}
          waveColor="#8B5CF6"
          progressColor="#7C3AED"
          cursorColor="#7C3AED"
          barWidth={2}
          barGap={1}
          barRadius={2}
          onReady={onReady}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeupdate={(wavesurfer) => setCurrentTime(wavesurfer.getCurrentTime())}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )}
      </div>
      
      {/* Time Display */}
      <div className="flex justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
      
      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button 
          onClick={skipBackward}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
          title="Skip backward 10s"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
        </button>
        
        <button
          onClick={onPlayPause}
          className="p-4 gradient-bg rounded-full hover:opacity-90 transition-opacity"
        >
          {isPlaying ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        
        <button 
          onClick={skipForward}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-colors"
          title="Skip forward 10s"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
          </svg>
        </button>
      </div>
      
      {/* Volume and Speed Controls */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Volume Control */}
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 w-10">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
        
        {/* Playback Speed */}
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="flex-1 px-2 py-1 glass rounded-lg text-sm"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="1.75">1.75x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Additional Info and Actions */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-lg font-semibold">320kbps</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Bitrate</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-lg font-semibold">MP3</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Format</div>
        </div>
        <div className="glass rounded-lg p-3 text-center">
          <div className="text-lg font-semibold">5.2MB</div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Size</div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-4 py-2 gradient-bg text-white rounded-lg hover:opacity-90 transition-opacity">
          Download Audio
        </button>
        <button className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.632 4.684C18.114 16.938 18 17.482 18 18c0 .482.114.938.316 1.342m0-2.684a3 3 0 110 2.684M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </button>
      </div>
    </div>
  )
}