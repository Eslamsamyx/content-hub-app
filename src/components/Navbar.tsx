'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import LanguageSwitcher from './LanguageSwitcher'
import MobileMenu from './MobileMenu'
import { getUserAvatar } from '@/utils/assetHelpers'
import { 
  ChevronDownIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  HeartIcon,
  FolderIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAuthenticatedNotifications } from '@/hooks/use-authenticated-api'

interface NavbarProps {
  lng: string
  translations: {
    home: string
    explore: string
    categories: string
    trending: string
    upload: string
    signIn: string
    signUp: string
    profile?: string
    settings?: string
    signOut?: string
    dashboard?: string
    collections?: string
    favorites?: string
    analytics?: string
  }
}

export default function Navbar({ lng, translations }: NavbarProps) {
  const { data: session, status } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Only fetch notifications if user is authenticated
  const { data: notifications } = useAuthenticatedNotifications()
  
  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0

  const navItems = [
    { name: translations.home, href: `/${lng}` },
    { name: translations.explore, href: `/${lng}/explore` },
    { name: translations.categories, href: `/${lng}/categories` },
    { name: translations.trending, href: `/${lng}/collections` },
  ]

  const userMenuItems = [
    { 
      name: translations.profile || 'Profile', 
      href: `/${lng}/profile`, 
      icon: UserIcon 
    },
    { 
      name: translations.collections || 'Collections', 
      href: `/${lng}/collections`, 
      icon: FolderIcon 
    },
    { 
      name: translations.favorites || 'Favorites', 
      href: `/${lng}/profile?tab=favorites`, 
      icon: HeartIcon 
    },
    ...(session?.user?.role === 'ADMIN' ? [{
      name: translations.dashboard || 'Dashboard',
      href: `/${lng}/admin`,
      icon: ChartBarIcon
    }] : []),
    { 
      name: translations.settings || 'Settings', 
      href: `/${lng}/profile?tab=settings`, 
      icon: Cog6ToothIcon 
    },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: `/${lng}` })
  }

  return (
    <nav className="fixed top-0 w-full glass border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={`/${lng}`} className="text-2xl font-bold gradient-text">
              ContentHub
            </Link>
            
            <div className="hidden md:flex items-center ml-10 space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium px-3 py-2 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Upload Button */}
            {session && (
              <Link 
                href={`/${lng}/upload`}
                className="hidden md:flex items-center px-4 py-2 text-sm font-medium glass rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {translations.upload}
              </Link>
            )}

            {/* Notifications */}
            {session && (
              <Link
                href={`/${lng}/notifications`}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Authentication */}
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/20 relative">
                    <ClientImage 
                      src={getUserAvatar(null, session.user.name || session.user.email)}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium hidden lg:block">
                    {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 hidden lg:block" />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {session.user.name || session.user.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {session.user.email}
                      </p>
                      {session.user.role && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                          {session.user.role}
                        </p>
                      )}
                    </div>

                    {/* Menu Items */}
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className="w-4 h-4 mr-3" />
                        {item.name}
                      </Link>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      {translations.signOut || 'Sign Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={`/${lng}/login`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white gradient-bg rounded-lg hover:opacity-90 transition-opacity"
              >
                {translations.signIn}
              </Link>
            )}
            
            <LanguageSwitcher lng={lng} />
            
            <MobileMenu lng={lng} navItems={navItems} translations={translations} />
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  )
}