'use client'

import { ReactNode } from 'react'

interface Category {
  id: string
  name: string
  icon: ReactNode
  glowColor: string
  count: number
}

interface CategoriesHeroProps {
  categories: Category[]
  totalAssets: number
}

export default function CategoriesHero({ categories, totalAssets }: CategoriesHeroProps) {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 min-h-[600px]">
      {/* Dynamic animated background */}
      <div className="absolute inset-0">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10" />
        
        {/* Floating category icons */}
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="absolute opacity-10 animate-float"
            style={{
              left: `${15 + (index * 15)}%`,
              top: `${20 + (index % 2 === 0 ? 0 : 40)}%`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: `${20 + index * 2}s`
            }}
          >
            <div className={`text-${category.glowColor}-500 transform scale-[2] rotate-${index * 15}`}>
              {category.icon}
            </div>
          </div>
        ))}
        
        {/* Animated gradient orbs */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-gradient-to-br from-purple-500/30 to-violet-500/30 rounded-full blur-3xl animate-float animation-delay-4000" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '6s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }} />
      </div>
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          
          {/* Main title with animation */}
          <div className="relative mb-8">
            {/* Title background glow */}
            <div className="absolute inset-0 blur-3xl opacity-20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-gradient-x" />
            </div>
            
            <h1 className="relative text-6xl md:text-7xl lg:text-8xl font-bold">
              <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-x leading-tight">
                Asset
              </span>
              <span className="block -mt-2 bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent animate-gradient-x leading-tight" style={{ animationDelay: '0.5s' }}>
                Categories
              </span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover a world of{' '}
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-primary/20 blur-xl rounded-lg" />
              <span className="relative font-semibold text-primary dark:text-primary px-1">creative assets</span>
            </span>
            {' '}designed to bring your projects to life
          </p>
          
          {/* Interactive stats cards - Minimal design */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-5xl mx-auto">
            {[
              { 
                value: totalAssets.toLocaleString(), 
                label: 'Total Assets', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                ),
                color: 'text-red-500',
                bgColor: 'bg-red-500/10',
                delay: '0s'
              },
              { 
                value: categories.length, 
                label: 'Categories', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                ),
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
                delay: '0.1s'
              },
              { 
                value: '24/7', 
                label: 'Availability', 
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'text-purple-500',
                bgColor: 'bg-purple-500/10',
                delay: '0.2s'
              }
            ].map((stat, index) => (
              <div 
                key={index}
                className="group relative flex items-center space-x-4"
                style={{ 
                  animation: 'fadeInUp 0.6s ease-out forwards',
                  animationDelay: stat.delay,
                  opacity: 0
                }}
              >
                {/* Vertical divider (except for first item) */}
                {index > 0 && (
                  <div className="absolute -left-6 md:-left-8 h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                )}
                
                {/* Icon */}
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} ${stat.color} transition-all duration-300 group-hover:scale-110`}>
                  {stat.icon}
                </div>
                
                {/* Text content */}
                <div className="flex flex-col">
                  <p className={`text-2xl font-bold ${stat.color} transition-all duration-300 group-hover:scale-105`}>
                    {stat.value}
                  </p>
                  <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Modern scroll indicator */}
          <div className="mt-16 flex flex-col items-center">
            <button 
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
              className="relative group"
              aria-label="Scroll to categories"
            >
              {/* Animated rings */}
              <div className="absolute inset-0 -m-2">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/20 to-transparent animate-ping" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-primary/10 to-transparent animate-ping" style={{ animationDelay: '0.5s' }} />
              </div>
              
              {/* Mouse scroll icon container */}
              <div className="relative w-10 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-primary dark:group-hover:border-primary transition-colors duration-300">
                {/* Mouse wheel */}
                <div className="absolute left-1/2 top-2 w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full -translate-x-1/2 animate-wheel" />
                
                {/* Chevron arrow below */}
                <svg className="absolute left-1/2 bottom-1 w-4 h-4 -translate-x-1/2 text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Modern gradient line */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-6 bg-gradient-to-b from-gray-300 dark:from-gray-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>
            
            {/* Minimal text */}
            <p className="mt-10 text-[11px] uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 font-light opacity-0 animate-fadeIn" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              Discover More
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}