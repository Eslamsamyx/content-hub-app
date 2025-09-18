'use client'

import { useEffect, useState } from 'react'

export default function WireAnimation() {
  const [mounted, setMounted] = useState(false)
  const [icons, setIcons] = useState<Array<{ id: number; delay: number; type: string }>>([])

  useEffect(() => {
    setMounted(true)
    // Generate flowing icons
    const iconTypes = ['video', 'image', '3d', 'document', 'audio']
    const newIcons = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: i * 4, // 4 second intervals to prevent overlap
      type: iconTypes[i]
    }))
    setIcons(newIcons)
  }, [])

  // Don't render on server to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="fixed left-0 top-1/3 h-2/3 w-32 pointer-events-none z-[2] hidden lg:block">
      {/* Wire Path */}
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 128 667"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient for wire */}
          <linearGradient id="wireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgb(107, 114, 128)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(107, 114, 128)" stopOpacity="0.1" />
          </linearGradient>
          
          {/* Glow filter for bulb */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Wire */}
        <path
          id="wirePath"
          d="M 20 617 C 20 550 15 500 25 430 C 35 360 15 300 30 230 C 45 160 10 100 30 50"
          fill="none"
          stroke="url(#wireGradient)"
          strokeWidth="4"
          className="dark:opacity-50"
        />
      </svg>

      {/* Classic ON/OFF Switch */}
      <div className="absolute bottom-8 left-2">
        <div className="relative">
          {/* Switch base */}
          <div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg border-2 border-gray-300 dark:border-gray-600">
            {/* Switch toggle - ON position */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-10 bg-gradient-to-b from-gray-100 to-gray-300 dark:from-gray-600 dark:to-gray-800 rounded shadow-md transform -rotate-12">
              {/* ON text */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-700 dark:text-gray-300">ON</div>
            </div>
            {/* Switch center pivot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full" />
            {/* OFF text (visible but dimmed) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-400 dark:text-gray-600">OFF</div>
            {/* Power indicator - glowing green */}
            <div className="absolute -top-1 -right-1 w-3 h-3">
              <div className="absolute inset-0 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-green-400 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Brain at top */}
      <div className="absolute top-0 -left-10">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute -inset-16 bg-purple-400/40 dark:bg-purple-300/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -inset-12 bg-pink-400/30 dark:bg-pink-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -inset-8 bg-blue-400/20 dark:bg-blue-300/15 rounded-full blur-xl" />
          
          {/* Brain */}
          <svg width="150" height="150" viewBox="0 0 150 150" className="relative">
            <defs>
              <radialGradient id="brainGradient">
                <stop offset="0%" stopColor="#e9d5ff" />
                <stop offset="40%" stopColor="#c084fc" />
                <stop offset="80%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
              <filter id="brainGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Brain shape - more realistic */}
            <g transform="scale(2) translate(15, 15)">
              {/* Main brain body */}
              <path
                d="M 40 15 
                   C 30 15 22 18 18 25
                   C 15 30 15 35 16 40
                   C 14 42 14 45 15 48
                   C 16 52 18 55 22 58
                   C 26 62 32 65 40 65
                   C 48 65 54 62 58 58
                   C 62 55 64 52 65 48
                   C 66 45 66 42 64 40
                   C 65 35 65 30 62 25
                   C 58 18 50 15 40 15 Z"
                fill="url(#brainGradient)"
                filter="url(#brainGlow)"
                className="animate-pulse"
                style={{ animationDuration: '3s' }}
              />
              
              {/* Brain folds/gyri */}
              <path
                d="M 25 25 Q 30 22 35 25
                   M 35 25 Q 40 22 45 25
                   M 45 25 Q 50 22 55 25
                   M 22 35 Q 27 32 32 35
                   M 48 35 Q 53 32 58 35
                   M 25 45 Q 30 42 35 45
                   M 45 45 Q 50 42 55 45
                   M 30 55 Q 35 52 40 55
                   M 40 55 Q 45 52 50 55"
                stroke="#a855f7"
                strokeWidth="1.5"
                fill="none"
                opacity="0.6"
              />
              
              {/* Central fissure */}
              <path
                d="M 40 20 L 40 60"
                stroke="#9333ea"
                strokeWidth="2"
                fill="none"
                opacity="0.4"
              />
            </g>
            
            {/* Neural connections */}
            <g className="opacity-60" transform="scale(2) translate(15, 15)">
              <circle cx="25" cy="25" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="40" cy="20" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              <circle cx="55" cy="25" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              <circle cx="30" cy="40" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
              <circle cx="50" cy="40" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '1s' }} />
              <circle cx="40" cy="55" r="2" fill="#fff" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
            </g>
          </svg>
        </div>
      </div>

      {/* Flowing media icons */}
      <svg className="absolute left-0 top-0 w-full h-full">
        <defs>
          <path id="iconPath" d="M 20 617 C 20 550 15 500 25 430 C 35 360 15 300 30 230 C 45 160 10 100 30 50" />
        </defs>
        {icons.map((icon) => (
          <g key={icon.id}>
            <animateMotion
              dur="10s"
              repeatCount="indefinite"
              begin={`${icon.delay}s`}
            >
              <mpath href="#iconPath" />
            </animateMotion>
            <foreignObject width="50" height="50" x="-25" y="-25">
              <div className="w-full h-full flex items-center justify-center animate-icon-fade" style={{ animationDelay: `${icon.delay}s` }}>
                {/* Icon */}
                <div className="relative w-10 h-10 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20">
                  {icon.type === 'video' && (
                    <>
                      <div className="absolute -inset-2 bg-red-400/30 dark:bg-red-300/20 rounded-full blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-red-400 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </>
                  )}
                  {icon.type === 'image' && (
                    <>
                      <div className="absolute -inset-2 bg-blue-400/30 dark:bg-blue-300/20 rounded-full blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-blue-400 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </>
                  )}
                  {icon.type === '3d' && (
                    <>
                      <div className="absolute -inset-2 bg-purple-400/30 dark:bg-purple-300/20 rounded-full blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-purple-400 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </>
                  )}
                  {icon.type === 'document' && (
                    <>
                      <div className="absolute -inset-2 bg-orange-400/30 dark:bg-orange-300/20 rounded-full blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-orange-400 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </>
                  )}
                  {icon.type === 'audio' && (
                    <>
                      <div className="absolute -inset-2 bg-pink-400/30 dark:bg-pink-300/20 rounded-full blur-md" />
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-pink-400 relative z-10">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </>
                  )}
                </div>
              </div>
            </foreignObject>
          </g>
        ))}
      </svg>
    </div>
  )
}