'use client'

import { useState } from 'react'
import Image, { ImageProps } from 'next/image'

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string
}

export default function SafeImage({ src, alt, fallbackSrc = '/placeholder.svg', ...props }: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  return (
    <Image
      {...props}
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt}
      onError={() => {
        setHasError(true)
        setImgSrc(fallbackSrc)
      }}
      unoptimized={hasError} // Disable optimization for fallback images
    />
  )
}