'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FooterProps {
  dictionary?: Record<string, string>
  lng: string
}

export default function Footer({ lng }: FooterProps) {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [currentYear] = useState(new Date().getFullYear())
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const socialLinks = [
    { name: 'Twitter', icon: 'twitter', href: '#', color: 'from-blue-400 to-blue-600' },
    { name: 'GitHub', icon: 'github', href: '#', color: 'from-gray-600 to-gray-800' },
    { name: 'LinkedIn', icon: 'linkedin', href: '#', color: 'from-blue-600 to-blue-800' },
    { name: 'Discord', icon: 'discord', href: '#', color: 'from-purple-500 to-purple-700' },
  ]

  const footerLinks = [
    {
      title: 'Design Guidelines',
      links: [
        { name: 'Brand Standards', href: '#' },
        { name: 'Color Palette', href: '#' },
        { name: 'Typography Rules', href: '#' },
        { name: 'Logo Usage', href: '#' },
      ]
    },
    {
      title: 'Asset Guidelines',
      links: [
        { name: 'File Naming', href: '#' },
        { name: 'Version Control', href: '#' },
        { name: 'Export Settings', href: '#' },
        { name: 'Quality Standards', href: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Design Templates', href: '#' },
        { name: 'UI Kit', href: '#' },
        { name: 'Icon Library', href: '#' },
        { name: 'Best Practices', href: '#' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Video Tutorials', href: '#' },
        { name: 'Community Forum', href: '#' },
        { name: 'Contact Design Team', href: '#' },
      ]
    }
  ]

  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent">
        <div 
          className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Wave decoration */}
      <div className="absolute inset-x-0 top-0 h-px">
        <svg className="w-full h-12" viewBox="0 0 1200 40" preserveAspectRatio="none">
          <path 
            d="M0,20 Q300,0 600,20 T1200,20 L1200,40 L0,40 Z" 
            className="fill-gray-100/50 dark:fill-gray-900/50"
          >
            <animate 
              attributeName="d" 
              values="M0,20 Q300,0 600,20 T1200,20 L1200,40 L0,40 Z;
                      M0,20 Q300,40 600,20 T1200,20 L1200,40 L0,40 Z;
                      M0,20 Q300,0 600,20 T1200,20 L1200,40 L0,40 Z"
              dur="10s" 
              repeatCount="indefinite" 
            />
          </path>
        </svg>
      </div>

      <div className="relative bg-gradient-to-b from-transparent via-gray-50/50 dark:via-gray-900/50 to-white dark:to-black backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            {/* Brand section */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Content Hub
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Centralized design assets for consistent brand experience.
                </p>
              </div>
              
              {/* Quick designer tips */}
              <div className="mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-2">Designer Tip</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Always check the brand guidelines before creating new assets. Consistency is key to maintaining brand identity.
                </p>
              </div>
              
              {/* Social links with hover effects */}
              <div className="flex space-x-4 mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="group relative"
                    onMouseEnter={() => setHoveredIcon(social.name)}
                    onMouseLeave={() => setHoveredIcon(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${social.color} rounded-lg blur-lg transition-opacity duration-300 ${hoveredIcon === social.name ? 'opacity-60' : 'opacity-0'}`} />
                    <div className="relative w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-gray-700">
                      <SocialIcon name={social.icon} />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Links sections */}
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors duration-200 relative group"
                      >
                        <span className="relative">
                          {link.name}
                          <span className="absolute left-0 bottom-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>


          {/* Bottom bar */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © {currentYear} Content Hub. All rights reserved.
              </p>
              
              {/* Language selector */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>{lng === 'en' ? 'English' : 'Français'}</span>
                  </button>
                </div>
                
                {/* Theme toggle */}
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              bottom: '10%',
              animation: `float-up ${10 + i * 2}s linear infinite`,
              animationDelay: `${i * 2}s`
            }}
          />
        ))}
      </div>
    </footer>
  )
}

// Social icon component
function SocialIcon({ name }: { name: string }) {
  const icons: { [key: string]: React.ReactElement } = {
    twitter: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    discord: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
      </svg>
    ),
  }
  
  return icons[name] || null
}