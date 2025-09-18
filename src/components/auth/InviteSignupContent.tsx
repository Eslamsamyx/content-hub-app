'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Country, State, City } from 'country-state-city'

interface InviteSignupFormData {
  // Basic Info
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  
  // Profile Info
  jobTitle: string
  department: string
  phone: string
  bio: string
  
  // Location
  country: string
  state: string
  city: string
  
  // Social Links
  linkedin: string
  twitter: string
  website: string
  
  // Settings
  acceptTerms: boolean
}

interface InviteData {
  email: string
  firstName: string
  lastName: string
  department: string
  role: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  jobTitle?: string
  department?: string
  phone?: string
  bio?: string
  country?: string
  state?: string
  city?: string
  linkedin?: string
  twitter?: string
  website?: string
  acceptTerms?: string
}

const departments = [
  'Engineering',
  'Design', 
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Other'
]

const mockInviteData: Record<string, InviteData> = {
  'valid-token-123': {
    email: 'john.doe@company.com',
    firstName: 'John',
    lastName: 'Doe',
    department: 'Engineering',
    role: 'Developer'
  }
}

export default function InviteSignupContent({ lng, token }: { lng: string, token?: string }) {
  const [formData, setFormData] = useState<InviteSignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    jobTitle: '',
    department: '',
    phone: '',
    bio: '',
    country: '',
    state: '',
    city: '',
    linkedin: '',
    twitter: '',
    website: '',
    acceptTerms: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [countries] = useState(Country.getAllCountries())
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([])
  const [cities, setCities] = useState<{ name: string }[]>([])

  // Validate invitation token on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }

    // Simulate API call to validate token
    setTimeout(() => {
      const invite = mockInviteData[token]
      if (invite) {
        setTokenValid(true)
        setInviteData(invite)
        setFormData(prev => ({
          ...prev,
          email: invite.email,
          firstName: invite.firstName,
          lastName: invite.lastName,
          department: invite.department
        }))
      } else {
        setTokenValid(false)
      }
    }, 1000)
  }, [token])

  // Update states when country changes
  useEffect(() => {
    if (formData.country) {
      const countryStates = State.getStatesOfCountry(formData.country)
      setStates(countryStates)
      setFormData(prev => ({ ...prev, state: '', city: '' }))
      setCities([])
    }
  }, [formData.country])

  // Update cities when state changes
  useEffect(() => {
    if (formData.state) {
      const stateCities = City.getCitiesOfState(formData.country, formData.state)
      setCities(stateCities)
      setFormData(prev => ({ ...prev, city: '' }))
    }
  }, [formData.state, formData.country])

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
    if (!formData.jobTitle) newErrors.jobTitle = 'Job title is required'
    if (!formData.department) newErrors.department = 'Please select a department'
    if (!formData.phone) newErrors.phone = 'Phone number is required'
    if (!formData.country) newErrors.country = 'Please select a country'
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

    // Simulate API call
    setTimeout(() => {
      console.log('Account creation:', formData)
      setIsLoading(false)
      // Handle successful account creation
    }, 2000)
  }

  // Show loading state while validating token
  if (tokenValid === null) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Validating invitation...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          <div className="text-center">
            <XMarkIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
            <p className="text-white/70 mb-6">
              This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
            </p>
            <Link
              href={`/${lng}/login`}
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02]"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Glass morphism card */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-white/70">You&apos;ve been invited to join Content Hub</p>
          {inviteData && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
              <p className="text-green-300 text-sm">
                Invited as <strong>{inviteData.role}</strong> in <strong>{inviteData.department}</strong>
              </p>
            </div>
          )}
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
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
                  } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                readOnly
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Work Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Work Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="jobTitle" className="block text-sm font-medium text-white/90 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  className={`w-full px-4 py-3 bg-white/10 border ${
                    errors.jobTitle ? 'border-red-400' : 'border-white/20'
                  } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="Senior Developer"
                />
                {errors.jobTitle && (
                  <p className="mt-1 text-sm text-red-400">{errors.jobTitle}</p>
                )}
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-white/90 mb-2">
                  Department
                </label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className={`w-full px-4 py-3 bg-white/10 border ${
                    errors.department ? 'border-red-400' : 'border-white/20'
                  } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                >
                  <option value="" className="bg-gray-800">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept} className="bg-gray-800">
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-400">{errors.department}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-3 bg-white/10 border ${
                  errors.phone ? 'border-red-400' : 'border-white/20'
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="bio" className="block text-sm font-medium text-white/90 mb-2">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Country
                </label>
                <Listbox
                  value={formData.country}
                  onChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <div className="relative">
                    <Listbox.Button className={`w-full px-4 py-3 bg-white/10 border ${
                      errors.country ? 'border-red-400' : 'border-white/20'
                    } rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}>
                      <span className="block truncate">
                        {formData.country ? countries.find(c => c.isoCode === formData.country)?.name : 'Select country'}
                      </span>
                      <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 border border-white/20 shadow-lg">
                      {countries.map((country) => (
                        <Listbox.Option
                          key={country.isoCode}
                          value={country.isoCode}
                          className={({ active }) =>
                            `cursor-pointer select-none py-3 px-4 ${
                              active ? 'bg-purple-600 text-white' : 'text-white/90'
                            }`
                          }
                        >
                          {country.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-400">{errors.country}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  State/Province
                </label>
                <Listbox
                  value={formData.state}
                  onChange={(value) => setFormData({ ...formData, state: value })}
                  disabled={!formData.country}
                >
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="block truncate">
                        {formData.state ? states.find(s => s.isoCode === formData.state)?.name : 'Select state'}
                      </span>
                      <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 border border-white/20 shadow-lg">
                      {states.map((state) => (
                        <Listbox.Option
                          key={state.isoCode}
                          value={state.isoCode}
                          className={({ active }) =>
                            `cursor-pointer select-none py-3 px-4 ${
                              active ? 'bg-purple-600 text-white' : 'text-white/90'
                            }`
                          }
                        >
                          {state.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  City
                </label>
                <Listbox
                  value={formData.city}
                  onChange={(value) => setFormData({ ...formData, city: value })}
                  disabled={!formData.state}
                >
                  <div className="relative">
                    <Listbox.Button className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
                      <span className="block truncate">
                        {formData.city ? cities.find(c => c.name === formData.city)?.name : 'Select city'}
                      </span>
                      <ChevronUpDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
                    </Listbox.Button>
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-gray-800 border border-white/20 shadow-lg">
                      {cities.map((city) => (
                        <Listbox.Option
                          key={city.name}
                          value={city.name}
                          className={({ active }) =>
                            `cursor-pointer select-none py-3 px-4 ${
                              active ? 'bg-purple-600 text-white' : 'text-white/90'
                            }`
                          }
                        >
                          {city.name}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Social Links (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-white/90 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  id="linkedin"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="twitter" className="block text-sm font-medium text-white/90 mb-2">
                    Twitter Handle
                  </label>
                  <input
                    type="text"
                    id="twitter"
                    value={formData.twitter}
                    onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="@johndoe"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-white/90 mb-2">
                    Personal Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://johndoe.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Password Setup */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Password Setup</h3>
            <div className="space-y-4">
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
                    } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
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
                    } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
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
            </div>
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
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
              'Complete Registration'
            )}
          </button>
        </form>

        {/* Login link */}
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