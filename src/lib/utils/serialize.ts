/**
 * Utility functions for serializing database objects for JSON responses
 */

/**
 * Convert BigInt values to strings in an object
 * This is necessary because JSON.stringify doesn't support BigInt
 */
export function serializeBigInt<T extends Record<string, any>>(obj: T): T {
  const serialized = { ...obj }
  
  for (const key in serialized) {
    const value = serialized[key]
    
    if (typeof value === 'bigint') {
      // Convert BigInt to string
      serialized[key] = value.toString() as any
    } else if (value && typeof value === 'object') {
      // Recursively handle nested objects
      if (Array.isArray(value)) {
        serialized[key] = value.map(item => 
          typeof item === 'object' ? serializeBigInt(item) : item
        ) as any
      } else if (value.constructor === Object) {
        serialized[key] = serializeBigInt(value) as any
      }
    }
  }
  
  return serialized
}

/**
 * Serialize an asset object, converting BigInt fields to strings
 */
export function serializeAsset(asset: any) {
  if (!asset) return asset
  
  return {
    ...asset,
    fileSize: asset.fileSize?.toString(),
    // Handle variants if present
    variants: asset.variants?.map((v: any) => ({
      ...v,
      fileSize: v.fileSize?.toString()
    })),
    // Handle metadata if present
    metadata: asset.metadata ? {
      ...asset.metadata,
      bitRate: asset.metadata.bitRate?.toString()
    } : undefined
  }
}

/**
 * Serialize multiple assets
 */
export function serializeAssets(assets: any[]) {
  return assets.map(serializeAsset)
}