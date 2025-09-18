'use client'

import { useState, useRef, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  placeholder?: string
  className?: string
}

export default function TagInput({ 
  value = [], 
  onChange, 
  suggestions = [], 
  placeholder = 'Add tags...', 
  className = '' 
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(tag)
        )
        .slice(0, 10)
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setFilteredSuggestions([])
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions, value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag])
      setInputValue('')
      setShowSuggestions(false)
      setSelectedIndex(-1)
      inputRef.current?.focus()
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < filteredSuggestions.length) {
        addTag(filteredSuggestions[selectedIndex])
      } else if (inputValue.trim()) {
        addTag(inputValue)
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="w-full min-h-[48px] px-4 py-2 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 flex flex-wrap gap-2 items-center">
        {value.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/20 text-primary text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-primary-dark transition-colors"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none placeholder-white/50"
        />
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 max-h-48 overflow-auto rounded-xl bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                index === selectedIndex ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {suggestion}
            </button>
          ))}
          {inputValue.trim() && !filteredSuggestions.includes(inputValue.trim()) && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-primary/10 transition-colors text-gray-600 dark:text-gray-400 italic"
            >
              Add &ldquo;{inputValue}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}