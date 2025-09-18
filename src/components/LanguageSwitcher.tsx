'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { languages } from '@/app/i18n/settings'

export default function LanguageSwitcher({ lng }: { lng: string }) {
  const pathname = usePathname()
  
  const redirectedPathname = (locale: string) => {
    if (!pathname) return '/'
    const segments = pathname.split('/')
    segments[1] = locale
    return segments.join('/')
  }

  return (
    <div className="flex gap-2">
      {languages.filter((l) => lng !== l).map((l) => {
        return (
          <Link
            key={l}
            href={redirectedPathname(l)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {l.toUpperCase()}
          </Link>
        )
      })}
    </div>
  )
}