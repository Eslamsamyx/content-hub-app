'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'

interface AdminCustomDropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface AdminCustomDropdownProps {
  value: string
  onChange: (value: string) => void
  options: AdminCustomDropdownOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  width?: string
  'aria-label'?: string
}

export default function AdminCustomDropdown({
  value,
  onChange,
  options,
  placeholder = "Select option",
  disabled = false,
  className = "",
  width = "w-48",
  'aria-label': ariaLabel
}: AdminCustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(option => option.value === value)
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  const handleOptionSelect = (optionValue: string) => {
    if (!disabled && optionValue !== value) {
      onChange(optionValue)
    }
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className={`relative ${width} ${className}`} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`
          w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white 
          focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
          flex items-center justify-between
        `}
      >
        <span className="truncate">
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDownIcon 
          className={`h-5 w-5 text-white/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              disabled={option.disabled}
              className={`
                w-full flex items-center justify-between px-4 py-2 text-sm text-left
                ${option.value === value
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <CheckIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}
          
          {options.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}