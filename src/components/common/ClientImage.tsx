'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ClientImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
  fallbackSrc?: string
  sizes?: string
  style?: React.CSSProperties
}

export default function ClientImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority = false,
  fallbackSrc = '/api/placeholder/400/300',
  sizes,
  style,
}: ClientImageProps) {
  const [imgSrc, setImgSrc] = useState(fallbackSrc)
  const [isClient, setIsClient] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && src) {
      setImgSrc(src)
      setHasError(false)
    }
  }, [isClient, src])

  const handleError = () => {
    console.warn(`Failed to load image: ${src}`)
    setHasError(true)
    setImgSrc(fallbackSrc)
  }

  // During SSR or when there's an error, use unoptimized image
  const shouldUnoptimize = !isClient || hasError || process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === 'true'

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        unoptimized={shouldUnoptimize}
        priority={priority}
        sizes={sizes}
        style={style}
      />
    )
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 400}
      height={height || 300}
      className={className}
      onError={handleError}
      unoptimized={shouldUnoptimize}
      priority={priority}
      style={style}
    />
  )
}