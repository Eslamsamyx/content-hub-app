'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ImageWithFallbackProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  fallbackSrc?: string
  priority?: boolean
}

export default function ImageWithFallback({
  src,
  alt,
  width,
  height,
  fill,
  className,
  fallbackSrc = '/placeholder.svg',
  priority = false,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setImgSrc(src)
    setHasError(false)
  }, [src])

  // Check if we should disable optimization
  const shouldUnoptimize = process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === 'true' || hasError

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`)
    setHasError(true)
    setImgSrc(fallbackSrc)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-pulse bg-gray-300 dark:bg-gray-600 rounded w-full h-full" />
        </div>
      )}
      {fill ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={shouldUnoptimize}
          priority={priority}
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          width={width || 400}
          height={height || 300}
          className={className}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={shouldUnoptimize}
          priority={priority}
        />
      )}
    </div>
  )
}