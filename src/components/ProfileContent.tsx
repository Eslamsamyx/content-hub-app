'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import { Listbox, Transition } from '@headlessui/react'
import { Country, State, City } from 'country-state-city'
import UploadActivity from './UploadActivity'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface ProfileContentProps {
  lng: string
}

interface UserProfile {
  name: string
  email: string
  phone: string
  role: string
  department: string
  joinDate: string
  avatar: string
  bio: string
  location: string
  website: string
  social: {
    linkedin?: string
    twitter?: string
    behance?: string
    dribbble?: string
  }
}

interface UserStats {
  totalAssets: number
  totalViews: number
  totalDownloads: number
  totalLikes: number
  weeklyUploads: number
  monthlyUploads: number
}

interface RecentAsset {
  id: string
  title: string
  type: 'video' | 'image' | '3d' | 'design' | 'audio' | 'document'
  thumbnail: string
  uploadDate: string
  views: number
  downloads: number
  likes: number
}

export default function ProfileContent({ lng }: ProfileContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'uploads' | 'collections' | 'settings'>('overview')
  const [isEditMode, setIsEditMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Mock user data - in real app this would come from API
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    phone: '+971 50 123 4567',
    role: 'Senior Creative Director',
    department: 'Creative',
    joinDate: 'January 2023',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    bio: 'Passionate about creating compelling visual stories that connect brands with their audiences. Leading creative teams to deliver exceptional digital experiences.',
    location: 'Dubai, UAE',
    website: 'sarahjohnson.design',
    social: {
      linkedin: 'linkedin.com/in/sarahjohnson',
      twitter: '@sarahj_design',
      behance: 'behance.net/sarahjohnson',
      dribbble: 'dribbble.com/sarahj'
    }
  })

  // Temporary state for editing
  const [editedProfile, setEditedProfile] = useState<UserProfile>(userProfile)

  // Location state for country/city selection
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([])
  const [cities, setCities] = useState<{ name: string }[]>([])

  // Available departments
  const availableDepartments = [
    'Creative',
    'Marketing',
    'Product',
    'Engineering',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Brand',
    'L&D',
    'Events',
    'Architecture',
    '3D'
  ]

  // Handle edit mode
  const handleEditClick = () => {
    setIsEditMode(true)
    setEditedProfile(userProfile)
  }

  const handleSaveClick = () => {
    setUserProfile(editedProfile)
    setIsEditMode(false)
  }

  const handleCancelClick = () => {
    setEditedProfile(userProfile)
    setIsEditMode(false)
  }

  const handleFieldChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSocialChange = (platform: keyof UserProfile['social'], value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [platform]: value
      }
    }))
  }

  // Handle country selection
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setSelectedState('')
    setSelectedCity('')
    
    // Get states for selected country
    const countryStates = State.getStatesOfCountry(countryCode)
    setStates(countryStates)
    setCities([])
    
    // Update location with country name
    const country = Country.getCountryByCode(countryCode)
    if (country) {
      handleFieldChange('location', country.name)
    }
  }

  // Handle state selection
  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    setSelectedCity('')
    
    // Get cities for selected state
    const stateCities = City.getCitiesOfState(selectedCountry, stateCode)
    setCities(stateCities)
    
    // Update location with state and country
    const country = Country.getCountryByCode(selectedCountry)
    const state = State.getStateByCodeAndCountry(stateCode, selectedCountry)
    if (country && state) {
      handleFieldChange('location', `${state.name}, ${country.name}`)
    }
  }

  // Handle city selection
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    
    // Update location with city, state and country
    const country = Country.getCountryByCode(selectedCountry)
    const state = State.getStateByCodeAndCountry(selectedState, selectedCountry)
    if (country) {
      if (state) {
        handleFieldChange('location', `${cityName}, ${state.name}, ${country.name}`)
      } else {
        handleFieldChange('location', `${cityName}, ${country.name}`)
      }
    }
  }

  const userStats: UserStats = {
    totalAssets: 1247,
    totalViews: 45892,
    totalDownloads: 12456,
    totalLikes: 8923,
    weeklyUploads: 23,
    monthlyUploads: 98
  }

  // Mock data for all uploads (more than 8 for pagination demo)
  const allUploads: RecentAsset[] = [
    {
      id: '1',
      title: 'Brand Guidelines 2024',
      type: 'document',
      thumbnail: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop',
      uploadDate: '2 hours ago',
      views: 234,
      downloads: 45,
      likes: 23
    },
    {
      id: '2',
      title: 'Product Showcase Video',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=300&fit=crop',
      uploadDate: '1 day ago',
      views: 892,
      downloads: 123,
      likes: 67
    },
    {
      id: '3',
      title: '3D Product Model',
      type: '3d',
      thumbnail: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop',
      uploadDate: '3 days ago',
      views: 456,
      downloads: 78,
      likes: 34
    },
    {
      id: '4',
      title: 'Marketing Campaign Visuals',
      type: 'design',
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      uploadDate: '5 days ago',
      views: 1234,
      downloads: 234,
      likes: 89
    },
    {
      id: '5',
      title: 'Corporate Event Photos',
      type: 'image',
      thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
      uploadDate: '1 week ago',
      views: 567,
      downloads: 89,
      likes: 45
    },
    {
      id: '6',
      title: 'Podcast Episode Audio',
      type: 'audio',
      thumbnail: 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=400&h=300&fit=crop',
      uploadDate: '1 week ago',
      views: 345,
      downloads: 56,
      likes: 28
    },
    {
      id: '7',
      title: 'Annual Report 2023',
      type: 'document',
      thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
      uploadDate: '2 weeks ago',
      views: 789,
      downloads: 234,
      likes: 67
    },
    {
      id: '8',
      title: 'Product Demo Animation',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
      uploadDate: '2 weeks ago',
      views: 1456,
      downloads: 345,
      likes: 123
    },
    {
      id: '9',
      title: 'Social Media Templates',
      type: 'design',
      thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
      uploadDate: '3 weeks ago',
      views: 2345,
      downloads: 567,
      likes: 234
    },
    {
      id: '10',
      title: 'Office Interior 3D Render',
      type: '3d',
      thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      uploadDate: '3 weeks ago',
      views: 890,
      downloads: 123,
      likes: 78
    },
    {
      id: '11',
      title: 'Training Video Series',
      type: 'video',
      thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop',
      uploadDate: '1 month ago',
      views: 3456,
      downloads: 789,
      likes: 345
    },
    {
      id: '12',
      title: 'Company Logo Variations',
      type: 'design',
      thumbnail: 'https://images.unsplash.com/photo-1567360425618-1594206637d2?w=400&h=300&fit=crop',
      uploadDate: '1 month ago',
      views: 1234,
      downloads: 234,
      likes: 167
    }
  ]

  const recentAssets = allUploads.slice(0, 4) // Show only 4 in the overview

  const getAssetIcon = (type: string) => {
    const icons = {
      video: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      image: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      '3d': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      design: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      audio: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      document: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
    return icons[type as keyof typeof icons] || icons.document
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Profile Header Section */}
      <section className="relative pt-8">
        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                {/* Left side - Avatar and Info */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-xl relative">
                      <ClientImage 
                        src={isEditMode ? editedProfile.avatar : userProfile.avatar} 
                        alt={isEditMode ? editedProfile.name : userProfile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {isEditMode && (
                      <button className="absolute bottom-2 right-2 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="text-center md:text-left">
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedProfile.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className="text-3xl md:text-4xl font-bold mb-2 bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors"
                      />
                    ) : (
                      <h1 className="text-3xl md:text-4xl font-bold mb-2">{userProfile.name}</h1>
                    )}
                    
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedProfile.role}
                        onChange={(e) => handleFieldChange('role', e.target.value)}
                        className="text-lg text-gray-600 dark:text-gray-300 mb-2 bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors w-full"
                      />
                    ) : (
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">{userProfile.role}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {isEditMode ? (
                          <Listbox value={editedProfile.department} onChange={(value) => handleFieldChange('department', value)}>
                            <div className="relative">
                              <Listbox.Button className="relative min-w-[120px] cursor-pointer bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-left pr-6">
                                <span className="block truncate text-sm">{editedProfile.department}</span>
                                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                  </svg>
                                </span>
                              </Listbox.Button>
                              <Transition
                                as={Fragment}
                                leave="transition ease-in duration-100"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                              >
                                <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                                  {availableDepartments.map((dept) => (
                                    <Listbox.Option
                                      key={dept}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 px-4 text-sm ${
                                          active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                                        }`
                                      }
                                      value={dept}
                                    >
                                      {({ selected }) => (
                                        <>
                                          <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {dept}
                                          </span>
                                          {selected && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </Listbox.Option>
                                  ))}
                                </Listbox.Options>
                              </Transition>
                            </div>
                          </Listbox>
                        ) : (
                          userProfile.department
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {isEditMode ? (
                          <div className="flex items-center gap-2">
                            {/* Country Dropdown */}
                            <Listbox value={selectedCountry} onChange={handleCountryChange}>
                              <div className="relative">
                                <Listbox.Button className="relative min-w-[120px] cursor-pointer bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-left pr-6">
                                  <span className="block truncate text-sm">
                                    {selectedCountry ? Country.getCountryByCode(selectedCountry)?.name : 'Select Country'}
                                  </span>
                                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                    </svg>
                                  </span>
                                </Listbox.Button>
                                <Transition
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                >
                                  <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-[200px] overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                                    {Country.getAllCountries().map((country) => (
                                      <Listbox.Option
                                        key={country.isoCode}
                                        className={({ active }) =>
                                          `relative cursor-pointer select-none py-2 px-4 text-sm ${
                                            active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                                          }`
                                        }
                                        value={country.isoCode}
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                              {country.flag} {country.name}
                                            </span>
                                            {selected && (
                                              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </Listbox.Option>
                                    ))}
                                  </Listbox.Options>
                                </Transition>
                              </div>
                            </Listbox>

                            {/* State Dropdown (if country has states) */}
                            {states.length > 0 && (
                              <Listbox value={selectedState} onChange={handleStateChange}>
                                <div className="relative">
                                  <Listbox.Button className="relative min-w-[100px] cursor-pointer bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-left pr-6">
                                    <span className="block truncate text-sm">
                                      {selectedState ? State.getStateByCodeAndCountry(selectedState, selectedCountry)?.name : 'State'}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                      </svg>
                                    </span>
                                  </Listbox.Button>
                                  <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-[150px] overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                                      {states.map((state) => (
                                        <Listbox.Option
                                          key={state.isoCode}
                                          className={({ active }) =>
                                            `relative cursor-pointer select-none py-2 px-4 text-sm ${
                                              active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                                            }`
                                          }
                                          value={state.isoCode}
                                        >
                                          {({ selected }) => (
                                            <>
                                              <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {state.name}
                                              </span>
                                              {selected && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </Listbox>
                            )}

                            {/* City Dropdown */}
                            {cities.length > 0 && (
                              <Listbox value={selectedCity} onChange={handleCityChange}>
                                <div className="relative">
                                  <Listbox.Button className="relative min-w-[100px] cursor-pointer bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-left pr-6">
                                    <span className="block truncate text-sm">
                                      {selectedCity || 'City'}
                                    </span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                      </svg>
                                    </span>
                                  </Listbox.Button>
                                  <Transition
                                    as={Fragment}
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                  >
                                    <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-[150px] overflow-auto rounded-lg bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
                                      {cities.map((city) => (
                                        <Listbox.Option
                                          key={city.name}
                                          className={({ active }) =>
                                            `relative cursor-pointer select-none py-2 px-4 text-sm ${
                                              active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                                            }`
                                          }
                                          value={city.name}
                                        >
                                          {({ selected }) => (
                                            <>
                                              <span className={`block ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {city.name}
                                              </span>
                                              {selected && (
                                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                </span>
                                              )}
                                            </>
                                          )}
                                        </Listbox.Option>
                                      ))}
                                    </Listbox.Options>
                                  </Transition>
                                </div>
                              </Listbox>
                            )}
                          </div>
                        ) : (
                          userProfile.location
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Joined {userProfile.joinDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleSaveClick}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-200"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="px-6 py-2.5 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditClick}
                      className="px-6 py-2.5 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-200"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mt-6">
                {isEditMode ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border border-white/20 rounded-lg p-3 focus:border-primary focus:outline-none transition-colors resize-none"
                    placeholder="Write something about yourself..."
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-300">{userProfile.bio}</p>
                )}
              </div>

              {/* Quick Contact Info */}
              <div className="mt-6 flex flex-wrap gap-4">
                {/* Email */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {isEditMode ? (
                    <input
                      type="email"
                      value={editedProfile.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-sm"
                      placeholder="email@company.com"
                    />
                  ) : (
                    <a href={`mailto:${userProfile.email}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
                      {userProfile.email}
                    </a>
                  )}
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {isEditMode ? (
                    <input
                      type="tel"
                      value={editedProfile.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-sm"
                      placeholder="+971 50 123 4567"
                    />
                  ) : (
                    <a href={`tel:${userProfile.phone}`} className="text-sm text-primary hover:text-primary/80 transition-colors">
                      {userProfile.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-6">
                {isEditMode ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <input
                        type="text"
                        value={editedProfile.website}
                        onChange={(e) => handleFieldChange('website', e.target.value)}
                        className="flex-1 bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-sm"
                        placeholder="your-website.com"
                      />
                    </div>
                    {Object.entries(editedProfile.social).map(([platform, handle]) => (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="capitalize text-sm text-gray-400 w-20">{platform}:</span>
                        <input
                          type="text"
                          value={handle || ''}
                          onChange={(e) => handleSocialChange(platform as keyof UserProfile['social'], e.target.value)}
                          className="flex-1 bg-transparent border-b border-white/20 focus:border-primary focus:outline-none transition-colors text-sm"
                          placeholder={`Your ${platform} handle`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    {userProfile.website && (
                      <a href={`https://${userProfile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        {userProfile.website}
                      </a>
                    )}
                    {Object.entries(userProfile.social).map(([platform, handle]) => handle && (
                      <a key={platform} href={`https://${handle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                        <span className="capitalize">{platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="mt-8 mb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'uploads', label: 'Uploads', icon: '⬆️' },
                { id: 'collections', label: 'Collections', icon: '📁' },
                { id: 'settings', label: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'uploads' | 'collections' | 'settings')}
                  className={`py-4 px-4 border-b-2 font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { 
                    label: 'Total Assets', 
                    value: userStats.totalAssets.toLocaleString(), 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    ),
                    gradient: 'from-blue-500 to-cyan-500',
                    bgColor: 'bg-blue-500/10',
                    iconColor: 'text-blue-500'
                  },
                  { 
                    label: 'Total Views', 
                    value: userStats.totalViews.toLocaleString(), 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ),
                    gradient: 'from-purple-500 to-pink-500',
                    bgColor: 'bg-purple-500/10',
                    iconColor: 'text-purple-500'
                  },
                  { 
                    label: 'Downloads', 
                    value: userStats.totalDownloads.toLocaleString(), 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    ),
                    gradient: 'from-green-500 to-emerald-500',
                    bgColor: 'bg-green-500/10',
                    iconColor: 'text-green-500'
                  },
                  { 
                    label: 'Likes', 
                    value: userStats.totalLikes.toLocaleString(), 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    ),
                    gradient: 'from-red-500 to-pink-500',
                    bgColor: 'bg-red-500/10',
                    iconColor: 'text-red-500'
                  },
                  { 
                    label: 'This Week', 
                    value: userStats.weeklyUploads, 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    ),
                    gradient: 'from-indigo-500 to-purple-500',
                    bgColor: 'bg-indigo-500/10',
                    iconColor: 'text-indigo-500'
                  },
                  { 
                    label: 'This Month', 
                    value: userStats.monthlyUploads, 
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    gradient: 'from-amber-500 to-orange-500',
                    bgColor: 'bg-amber-500/10',
                    iconColor: 'text-amber-500'
                  }
                ].map((stat, index) => (
                  <div key={index} className="glass rounded-xl p-6 text-center group hover:scale-105 transition-all duration-300 relative overflow-hidden">
                    {/* Subtle gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    {/* Icon with colored background */}
                    <div className={`relative w-12 h-12 mx-auto mb-3 rounded-lg ${stat.bgColor} flex items-center justify-center ${stat.iconColor} transition-all duration-300 group-hover:scale-110`}>
                      {stat.icon}
                    </div>
                    
                    {/* Value with gradient text on hover */}
                    <p className={`text-2xl font-bold mb-1 transition-all duration-300 group-hover:bg-gradient-to-r group-hover:${stat.gradient} group-hover:bg-clip-text group-hover:text-transparent`}>
                      {stat.value}
                    </p>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Uploads */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Recent Uploads</h2>
                  <button 
                    onClick={() => setActiveTab('uploads')}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    View all →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recentAssets.map((asset) => (
                    <Link key={asset.id} href={`/${lng}/asset/${asset.id}`} className="group">
                      <div className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                        {/* Thumbnail */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <ClientImage 
                            src={asset.thumbnail} 
                            alt={asset.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Type badge */}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                            {getAssetIcon(asset.type)}
                            <span className="capitalize">{asset.type}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {asset.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{asset.uploadDate}</p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {asset.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              {asset.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {asset.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Activity Graph */}
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Monthly Upload Activity</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Last 12 months</span>
                  </div>
                </div>
                
                {/* Recharts Graph */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', uploads2024: 128, uploads2023: 89 },
                        { month: 'Feb', uploads2024: 156, uploads2023: 108 },
                        { month: 'Mar', uploads2024: 89, uploads2023: 118 },
                        { month: 'Apr', uploads2024: 178, uploads2023: 138 },
                        { month: 'May', uploads2024: 145, uploads2023: 128 },
                        { month: 'Jun', uploads2024: 118, uploads2023: 98 },
                        { month: 'Jul', uploads2024: 167, uploads2023: 148 },
                        { month: 'Aug', uploads2024: 134, uploads2023: 118 },
                        { month: 'Sep', uploads2024: 189, uploads2023: 158 },
                        { month: 'Oct', uploads2024: 156, uploads2023: 138 },
                        { month: 'Nov', uploads2024: 134, uploads2023: 128 },
                        { month: 'Dec', uploads2024: 167, uploads2023: 142 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          padding: '12px'
                        }}
                        labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                        itemStyle={{ color: '#f3f4f6' }}
                        formatter={(value) => `${value} uploads`}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="square"
                      />
                      <Bar 
                        dataKey="uploads2024" 
                        name="2024" 
                        fill="#3b82f6" 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                      <Bar 
                        dataKey="uploads2023" 
                        name="2023" 
                        fill="#9ca3af" 
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">1,761</div>
                    <div className="text-xs text-gray-500">Total Uploads</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">+23%</div>
                    <div className="text-xs text-gray-500">vs Last Year</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">147</div>
                    <div className="text-xs text-gray-500">Avg/Month</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Uploads Tab */}
          {activeTab === 'uploads' && (
            <div className="space-y-8">
              {/* Upload Activity */}
              <div>
                <h2 className="text-2xl font-bold mb-6">Recent Upload Activity</h2>
                <UploadActivity lng={lng} />
              </div>

              {/* All Uploads */}
              <div>
                <h2 className="text-2xl font-bold mb-6">All Uploads</h2>
                
                {/* Uploads Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {allUploads
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((asset) => (
                    <Link key={asset.id} href={`/${lng}/asset/${asset.id}`} className="group">
                      <div className="glass rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300">
                        {/* Thumbnail */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <ClientImage 
                            src={asset.thumbnail} 
                            alt={asset.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Type badge */}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                            {getAssetIcon(asset.type)}
                            <span className="capitalize">{asset.type}</span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {asset.title}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{asset.uploadDate}</p>
                          
                          {/* Stats */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {asset.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              {asset.downloads}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {asset.likes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>

              {/* Pagination */}
              {allUploads.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === 1
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(allUploads.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-primary text-white'
                            : 'hover:bg-white/10 dark:hover:bg-white/5'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(allUploads.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(allUploads.length / itemsPerPage)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      currentPage === Math.ceil(allUploads.length / itemsPerPage)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              </div>
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <div className="glass rounded-xl p-6">
              <p className="text-gray-500 dark:text-gray-400">Your collections will appear here...</p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Account Settings */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6">Account Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={userProfile.email}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Password</label>
                    <button className="px-4 py-2 rounded-lg bg-white/10 dark:bg-black/20 border border-white/20 hover:border-white/30 transition-all duration-200 text-sm">
                      Change Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6">Security</h3>
                <div className="space-y-6">
                  {/* 2FA Section */}
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-black/10 border border-white/10">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Add an extra layer of security to your account by enabling two-factor authentication
                        </p>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 text-sm">
                        Enable 2FA
                      </button>
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div>
                    <h4 className="font-medium mb-3">Active Sessions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-black/10">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium">Chrome on MacBook Pro</p>
                            <p className="text-xs text-gray-500">Dubai, UAE • Current session</p>
                          </div>
                        </div>
                        <span className="text-xs text-green-500">Active now</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-black/10">
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium">Safari on iPhone</p>
                            <p className="text-xs text-gray-500">Dubai, UAE • Last active 2 hours ago</p>
                          </div>
                        </div>
                        <button className="text-xs text-red-500 hover:text-red-400">Sign out</button>
                      </div>
                    </div>
                    <button className="mt-3 text-sm text-red-500 hover:text-red-400">Sign out all other sessions</button>
                  </div>
                </div>
              </div>

              {/* Team & Permissions */}
              <div className="glass rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6">Team & Permissions</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Role</label>
                    <div className="p-3 rounded-lg bg-white/5 dark:bg-black/10 border border-white/10">
                      <p className="font-medium">{userProfile.role}</p>
                      <p className="text-xs text-gray-500 mt-1">Full access to create, edit, and manage assets</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Department Access</label>
                    <div className="flex flex-wrap gap-2">
                      {['Creative', 'Marketing', 'Brand', 'Product'].map((dept) => (
                        <span key={dept} className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>



            </div>
          )}
        </div>
      </section>
    </div>
  )
}