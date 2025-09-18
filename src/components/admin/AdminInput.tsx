'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface AdminInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number
  onChange: (value: string) => void
  error?: boolean
  warning?: boolean
  label?: string
  helperText?: string
  errorMessage?: string
  warningMessage?: string
}

const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ 
    value, 
    onChange, 
    error, 
    warning, 
    label, 
    helperText, 
    errorMessage, 
    warningMessage, 
    className = '', 
    disabled,
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
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${baseClasses} ${className}`}
          {...props}
        />
        
        {/* Helper Text */}
        {helperText && !errorMessage && !warningMessage && (
          <p className="text-white/50 text-xs">{helperText}</p>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <p className="text-red-400 text-sm">{errorMessage}</p>
        )}
        
        {/* Warning Message */}
        {warningMessage && !errorMessage && (
          <p className="text-yellow-400 text-sm">{warningMessage}</p>
        )}
      </div>
    )
  }
)

AdminInput.displayName = 'AdminInput'

export default AdminInput