'use client'

import { useState } from 'react'

interface SearchBarProps {
  placeholder: string
  onSearch: (query: string) => void
}

export default function SearchBar({ placeholder, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
        {/* Multi-layer gradient background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 blur-2xl transition-all duration-500 ${isFocused ? 'opacity-70 scale-110' : 'opacity-0 scale-100'}`} />
          <div className={`absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        
        {/* Search container with enhanced glass effect */}
        <div className="relative bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-2xl border border-white/10 dark:border-white/10 overflow-hidden transition-all duration-300 hover:border-white/20 dark:hover:border-white/20 hover:bg-white/10 dark:hover:bg-black/20 shadow-lg">
          {/* Animated border gradient */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] opacity-0 transition-opacity duration-300 ${isFocused ? 'opacity-20 animate-gradient' : ''}`} />
          
          {/* Search icon with pulse effect */}
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <div className="relative">
              <svg 
                className={`h-5 w-5 transition-all duration-300 ${isFocused ? 'text-primary dark:text-primary scale-110' : 'text-gray-400 dark:text-gray-500'}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isFocused && (
                <div className="absolute inset-0 -m-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
              )}
            </div>
          </div>
          
          {/* Input field with better spacing */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            className="relative block w-full pl-16 pr-36 py-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base font-medium tracking-wide"
            placeholder={placeholder}
          />
          
          {/* Animated placeholder dots when empty and focused */}
          {!query && isFocused && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          
          {/* Clear button with better hover effect */}
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-32 flex items-center px-3 group/clear"
            >
              <div className="relative p-1.5 rounded-lg bg-gray-100/10 dark:bg-gray-800/10 hover:bg-gray-100/20 dark:hover:bg-gray-800/20 transition-all duration-200">
                <svg className="h-4 w-4 text-gray-400 group-hover/clear:text-gray-600 dark:group-hover/clear:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </button>
          )}
          
          {/* Enhanced search button */}
          <button
            type="submit"
            className="absolute inset-y-0 right-2 my-2 px-7 flex items-center bg-gradient-to-r from-primary to-secondary text-white rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 group/search"
          >
            <span className="font-semibold tracking-wide group-hover/search:tracking-wider transition-all duration-200">Search</span>
            <svg className="ml-2 -mr-1 w-4 h-4 group-hover/search:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        
        {/* Bottom highlight line */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500 ${isFocused ? 'w-full opacity-50' : 'w-0 opacity-0'}`} />
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </form>
  )
}