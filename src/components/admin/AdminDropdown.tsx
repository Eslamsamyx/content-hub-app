'use client'

import { forwardRef } from 'react'

interface AdminDropdownOption {
  value: string
  label: string
  disabled?: boolean
}

interface AdminDropdownProps {
  value: string
  onChange: (value: string) => void
  options: AdminDropdownOption[]
  placeholder?: string
  disabled?: boolean
  error?: boolean
  warning?: boolean
  className?: string
  'aria-label'?: string
}

const AdminDropdown = forwardRef<HTMLSelectElement, AdminDropdownProps>(
  ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    disabled, 
    error, 
    warning, 
    className = '', 
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const getStateClasses = () => {
      if (error) {
        return 'border-red-500/50 focus:ring-red-500'
      }
      if (warning) {
        return 'border-yellow-500/50 focus:ring-yellow-500'
      }
      return 'border-white/20 focus:ring-purple-500'
    }

    const baseClasses = [
      'w-full',
      'px-4 py-3',
      'bg-white/10',
      'border',
      'rounded-xl',
      'text-white',
      'placeholder-white/50',
      'focus:outline-none',
      'focus:ring-2',
      'hover:bg-white/15',
      'transition-all duration-200',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      getStateClasses()
    ].join(' ')

    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`${baseClasses} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden className="bg-gray-900 text-white">
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value} 
            disabled={option.disabled}
            className="bg-gray-900 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

AdminDropdown.displayName = 'AdminDropdown'

export default AdminDropdown