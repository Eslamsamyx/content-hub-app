'use client'

import { useEffect, useState } from 'react'

export default function AnimatedBackgroundCSS() {
  const [shapes, setShapes] = useState<Array<{
    id: number
    type: string
    left: string
    animationDelay: string
    animationDuration: string
    size: string
  }>>([])

  useEffect(() => {
    // Generate shapes only on client side to avoid hydration mismatch
    const generatedShapes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      type: ['video', 'image', '3d', 'document', 'audio'][i % 5],
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 20}s`,
      animationDuration: `${30 + Math.random() * 40}s`,
      size: `${40 + Math.random() * 60}px`
    }))
    setShapes(generatedShapes)
  }, [])

  // Don't render anything on server to avoid hydration issues
  if (shapes.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className="absolute animate-float-up opacity-[0.03] dark:opacity-[0.05]"
          style={{
            left: shape.left,
            animationDelay: shape.animationDelay,
            animationDuration: shape.animationDuration,
            width: shape.size,
            height: shape.size
          }}
        >
          {shape.type === 'video' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-600 dark:text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          {shape.type === 'image' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-600 dark:text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          {shape.type === '3d' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-600 dark:text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )}
          {shape.type === 'document' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-600 dark:text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {shape.type === 'audio' && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-600 dark:text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}