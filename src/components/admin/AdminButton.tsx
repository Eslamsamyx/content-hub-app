'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children: ReactNode
}

const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const getVariantClasses = () => {
      switch (variant) {
        case 'primary':
          return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
        case 'secondary':
          return 'border border-white/20 text-white hover:bg-white/10'
        case 'danger':
          return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        case 'ghost':
          return 'text-white hover:bg-white/10'
        default:
          return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
      }
    }

    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 text-sm'
        case 'md':
          return 'px-6 py-3'
        case 'lg':
          return 'px-8 py-4 text-lg'
        default:
          return 'px-6 py-3'
      }
    }

    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'gap-2',
      'font-medium',
      'rounded-xl',
      'transition-all',
      'duration-200',
      'transform',
      'hover:scale-105',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-purple-500',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:transform-none',
      getSizeClasses(),
      getVariantClasses()
    ].join(' ')

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${className}`}
        {...props}
      >
        {loading ? (
          <>
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
            {loadingText}
          </>
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

AdminButton.displayName = 'AdminButton'

export default AdminButton