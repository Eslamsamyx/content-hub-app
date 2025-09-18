import Link from 'next/link'
import { ReactNode } from 'react'

interface CategoryCardProps {
  name: string
  description: string
  icon: ReactNode
  gradientColors: string
  shadowColor: string
  count: number
  href: string
}

export default function CategoryCard({ 
  name, 
  description, 
  icon, 
  gradientColors, 
  shadowColor, 
  count, 
  href
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group relative"
    >
      {/* Card */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-white/20 dark:border-white/10 p-8 h-full transition-all duration-500 hover:scale-[1.03] hover:${shadowColor} hover:shadow-2xl`}>
        {/* Animated gradient background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors} opacity-0 group-hover:opacity-20 transition-all duration-700`} />
        
        {/* Floating orbs */}
        <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradientColors} opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity duration-700`} />
        <div className={`absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br ${gradientColors} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-700`} />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon container with glow effect */}
          <div className="relative mb-6">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors} opacity-50 blur-2xl group-hover:opacity-70 transition-opacity duration-500 rounded-full`} />
            <div className={`relative inline-flex p-5 rounded-2xl bg-gradient-to-br ${gradientColors} bg-opacity-10 backdrop-blur-sm border border-white/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          </div>
          
          {/* Title and description */}
          <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-secondary group-hover:bg-clip-text transition-all duration-300">
            {name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 line-clamp-2">
            {description}
          </p>
          
          {/* Stats and arrow */}
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-3xl font-bold bg-gradient-to-r ${gradientColors} bg-clip-text text-transparent`}>
                {count.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">assets</span>
            </div>
            
            {/* Animated arrow */}
            <div className={`p-2 rounded-full bg-gradient-to-r ${gradientColors} opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Bottom gradient line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColors} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
      </div>
    </Link>
  )
}