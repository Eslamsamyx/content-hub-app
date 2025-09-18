import Image from 'next/image'

interface ContentCardProps {
  title: string
  creator: string
  imageUrl: string
  type: 'video' | 'image' | '3d' | 'design'
  accessLevel?: 'internal' | 'public'
  isNew?: boolean
  isHot?: boolean
}

export default function ContentCard({ title, creator, imageUrl, type, accessLevel = 'internal', isNew, isHot }: ContentCardProps) {
  const typeIcons = {
    video: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
    ),
    image: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
    '3d': (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
      </svg>
    ),
    design: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-xl glass transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white/10 dark:hover:bg-white/5">
      <div className="aspect-[16/9] relative overflow-hidden bg-gray-100/50 dark:bg-gray-800/50">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && (
            <span className="px-3 py-1 text-xs font-semibold bg-success/90 text-white rounded-full backdrop-blur-sm">
              NEW
            </span>
          )}
          {isHot && (
            <span className="px-3 py-1 text-xs font-semibold bg-danger/90 text-white rounded-full backdrop-blur-sm">
              HOT
            </span>
          )}
          {accessLevel === 'public' ? (
            <span className="px-3 py-1 text-xs font-semibold bg-blue-500/90 text-white rounded-full backdrop-blur-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              Client
            </span>
          ) : (
            <span className="px-3 py-1 text-xs font-semibold bg-gray-700/90 text-white rounded-full backdrop-blur-sm flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Internal
            </span>
          )}
        </div>
        
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-semibold text-white mb-1 line-clamp-1 text-lg drop-shadow-lg">
            {title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-200 drop-shadow">
              by {creator}
            </p>
            <div className="p-2 bg-black/30 text-white rounded-lg backdrop-blur-md">
              {typeIcons[type]}
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
  )
}