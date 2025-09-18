'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'

interface MobileMenuProps {
  lng: string
  navItems: Array<{ name: string; href: string }>
  translations: {
    signUp: string
  }
}

export default function MobileMenu({ lng, navItems, translations }: MobileMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-background border-b border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'text-primary bg-primary/10'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href={`/${lng}/signup`}
              className="block px-3 py-2 rounded-md text-base font-medium text-white bg-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              {translations.signUp}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}