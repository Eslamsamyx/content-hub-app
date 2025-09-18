import Link from 'next/link'
import { useState, memo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ClientImage from '@/components/common/ClientImage'

interface AssetCardProps {
  id: string
  title: string
  type: 'video' | 'image' | '3d' | 'design' | 'document' | 'audio' | string
  thumbnail: string
  fileSize: string
  uploadDate: string
  uploadedBy: string
  downloads: number
  year: string
  usage: string
  company?: string
  readyForPublishing?: boolean
  allowDownload?: boolean
  lng: string
  translations: {
    download: string
    preview: string
  }
}

const AssetCard = memo(function AssetCard({ 
  id, 
  title, 
  type, 
  thumbnail, 
  fileSize, 
  uploadDate, 
  uploadedBy, 
  downloads,
  year,
  usage,
  company,
  readyForPublishing,
  allowDownload = false,
  lng,
  translations 
}: AssetCardProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isDownloading, setIsDownloading] = useState(false)
  const typeIcons: Record<string, React.ReactElement> = {
    video: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    '3d': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    '2d': (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    document: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    audio: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    )
  }


  const handleDownload = async () => {
    if (!session) {
      router.push(`/${lng}/login`)
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/assets/${id}/download`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const data = await response.json()
      if (data.success && data.data.downloadUrl) {
        // Open download URL in new tab
        window.open(data.data.downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="group glass rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
      <Link href={`/${lng}/asset/${id}`} className="block" prefetch={false}>
        <div className="aspect-video relative overflow-hidden bg-gray-100/50 dark:bg-gray-800/50">
          <ClientImage
            src={thumbnail}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-3 py-2 rounded-full text-white text-xs font-medium glass backdrop-blur-md flex items-center gap-2 border border-white/20`}>
              {typeIcons[type]}
              <span className="capitalize">{type}</span>
            </span>
            {readyForPublishing && (
              <span className="px-3 py-2 rounded-full text-white text-xs font-medium glass backdrop-blur-md flex items-center gap-2 border border-green-400/50 bg-green-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ready</span>
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
          <span className={`font-medium ${usage === 'Public' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
            {usage}
          </span>
          <span>•</span>
          <span>{year}</span>
          {company && (
            <>
              <span>•</span>
              <span>{company}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>{uploadedBy}</span>
          <span>{fileSize}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
          <span>{uploadDate}</span>
          <span>{downloads} downloads</span>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/${lng}/asset/${id}`}
            className="flex-1 py-2 px-3 text-sm font-medium text-center glass rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            prefetch={false}
          >
            {translations.preview}
          </Link>
          {allowDownload && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 py-2 px-3 text-sm font-medium text-white gradient-bg rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  {translations.download}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

export default AssetCard