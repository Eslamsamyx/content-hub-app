'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline'
import GoogleIcon from './GoogleIcon'
import MicrosoftIcon from './MicrosoftIcon'

interface SignupFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: string
  creativeRole?: string
  acceptTerms: boolean
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  creativeRole?: string
  acceptTerms?: string
  general?: string
}

const roles = [
  { value: 'USER', label: 'User' },
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'CREATIVE', label: 'Creative' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager' },
]

const creativeRoles = [
  { value: 'DESIGNER_2D', label: '2D Designer' },
  { value: 'DESIGNER_3D', label: '3D Designer' },
  { value: 'VIDEO_EDITOR', label: 'Video Editor' },
  { value: 'PHOTOGRAPHER', label: 'Photographer' },
  { value: 'AUDIO_PRODUCER', label: 'Audio Producer' },
  { value: 'CONTENT_DESIGNER', label: 'Content Designer' },
]

export default function SignupContent({ lng }: { lng: string }) {
  const router = useRouter()
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    creativeRole: '',
    acceptTerms: false
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Form validation
    const newErrors: FormErrors = {}
    if (!formData.firstName) newErrors.firstName = 'First name is required'
    if (!formData.lastName) newErrors.lastName = 'Last name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    if (!formData.role) newErrors.role = 'Please select a role'
    if (formData.role === 'CREATIVE' && !formData.creativeRole) {
      newErrors.creativeRole = 'Please select a creative role'
    }
    if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions'
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (formData.password && !passwordRequirements.every(req => req.met)) {
      newErrors.password = 'Password does not meet requirements'
    }
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          creativeRole: formData.role === 'CREATIVE' ? formData.creativeRole : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Registration failed' })
        setIsLoading(false)
        return
      }

      // Auto login after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        router.push(`/${lng}/login`)
      } else {
        router.push(`/${lng}/dashboard`)
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred' })
      setIsLoading(false)
    }
  }

  const handleSocialSignup = (provider: string) => {
    console.log(`Signup with ${provider}`)
    // Handle social signup
  }

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      {/* Glass morphism card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/70">Join Content Hub and start collaborating</p>
        </div>

        {/* Social Signup Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialSignup('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            onClick={() => handleSocialSignup('microsoft')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <MicrosoftIcon />
            Continue with Microsoft
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-transparent text-white/70">or create account with email</span>
          </div>
        </div>

        {/* Error message */}
        {errors.general && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{errors.general}</p>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.firstName ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.lastName ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-3 bg-white/10 border ${
                errors.email ? 'border-red-400' : 'border-white/20'
              } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              placeholder="john@company.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Role Field */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value, creativeRole: '' })}
              className={`w-full px-4 py-3 bg-white/10 border ${
                errors.role ? 'border-red-400' : 'border-white/20'
              } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
            >
              <option value="" className="bg-gray-800">Select your role</option>
              {roles.map((role) => (
                <option key={role.value} value={role.value} className="bg-gray-800">
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Creative Role Field (conditional) */}
          {formData.role === 'CREATIVE' && (
            <div>
              <label htmlFor="creativeRole" className="block text-sm font-medium text-white/90 mb-2">
                Creative Role
              </label>
              <select
                id="creativeRole"
                value={formData.creativeRole}
                onChange={(e) => setFormData({ ...formData, creativeRole: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.creativeRole ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
              >
                <option value="" className="bg-gray-800">Select your specialization</option>
                {creativeRoles.map((role) => (
                  <option key={role.value} value={role.value} className="bg-gray-800">
                    {role.label}
                  </option>
                ))}
              </select>
              {errors.creativeRole && (
                <p className="mt-1 text-sm text-red-400">{errors.creativeRole}</p>
              )}
            </div>
          )}

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-4 py-3 pr-12 bg-white/10 border ${
                  errors.password ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {formData.password && (
              <div className="mt-2 space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckIcon
                      className={`w-4 h-4 ${
                        req.met ? 'text-green-400' : 'text-white/40'
                      }`}
                    />
                    <span className={req.met ? 'text-green-400' : 'text-white/70'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 pr-12 bg-white/10 border ${
                  errors.confirmPassword ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="w-4 h-4 mt-1 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-sm text-white/90">
                I agree to the{' '}
                <Link href={`/${lng}/terms`} className="text-purple-300 hover:text-purple-200 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href={`/${lng}/privacy`} className="text-purple-300 hover:text-purple-200 underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-400">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Sign in link */}
        <div className="mt-8 text-center">
          <p className="text-white/70">
            Already have an account?{' '}
            <Link
              href={`/${lng}/login`}
              className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}