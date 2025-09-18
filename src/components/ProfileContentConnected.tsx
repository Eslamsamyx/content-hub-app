'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import ClientImage from '@/components/common/ClientImage'
import { Listbox, Transition } from '@headlessui/react'
import { Country, State, City } from 'country-state-city'
import UploadActivity from './UploadActivity'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useToast } from '@/contexts/ToastContext'
import { 
  useProfile, 
  useUpdateProfile, 
  useUploadAvatar, 
  useProfileUploads,
  useProfileActivity 
} from '@/hooks/use-api'
import {
  UserCircleIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  GlobeAltIcon,
  LinkIcon,
  CameraIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon,
  CubeIcon,
  PaintBrushIcon,
  CheckIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface ProfileContentConnectedProps {
  lng: string
}

const typeIcons: Record<string, any> = {
  IMAGE: PhotoIcon,
  VIDEO: VideoCameraIcon,
  DOCUMENT: DocumentIcon,
  AUDIO: MusicalNoteIcon,
  MODEL_3D: CubeIcon,
  DESIGN: PaintBrushIcon
}

const countries = Country.getAllCountries()

export default function ProfileContentConnected({ lng }: ProfileContentConnectedProps) {
  const { showSuccess, showError } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'uploads' | 'analytics' | 'activity'>('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Fetch data
  const { data: profile, loading: profileLoading, refetch: refetchProfile } = useProfile()
  const { data: uploads, loading: uploadsLoading } = useProfileUploads({ limit: 12 })
  const { data: activity, loading: activityLoading } = useProfileActivity({ limit: 20 })
  
  // Mutations
  const { mutate: updateProfile } = useUpdateProfile()
  const { mutate: uploadAvatar } = useUploadAvatar()

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    location: '',
    website: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      behance: '',
      dribbble: ''
    }
  })

  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [selectedState, setSelectedState] = useState<any>(null)
  const [selectedCity, setSelectedCity] = useState<any>(null)

  // Initialize form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        socialLinks: profile.socialLinks || {
          linkedin: '',
          twitter: '',
          behance: '',
          dribbble: ''
        }
      })
      
      // Parse location
      if (profile.location) {
        const parts = profile.location.split(', ')
        if (parts.length >= 2) {
          const countryData = countries.find(c => c.name === parts[parts.length - 1])
          if (countryData) {
            setSelectedCountry(countryData)
            const states = State.getStatesOfCountry(countryData.isoCode)
            const stateData = states.find(s => s.name === parts[parts.length - 2])
            if (stateData) {
              setSelectedState(stateData)
              if (parts.length >= 3) {
                const cities = City.getCitiesOfState(countryData.isoCode, stateData.isoCode)
                const cityData = cities.find(c => c.name === parts[0])
                if (cityData) setSelectedCity(cityData)
              }
            }
          }
        }
      }
    }
  })

  const handleSaveProfile = async () => {
    const location = [
      selectedCity?.name,
      selectedState?.name,
      selectedCountry?.name
    ].filter(Boolean).join(', ')

    try {
      await updateProfile({
        ...formData,
        location
      })
      showSuccess('Profile Updated', 'Your profile information has been successfully updated.')
      setIsEditing(false)
      refetchProfile()
    } catch (error) {
      console.error('Failed to update profile:', error)
      showError('Update Failed', 'Failed to update your profile. Please try again.')
    }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      await uploadAvatar(file)
      showSuccess('Avatar Updated', 'Your profile picture has been successfully updated.')
      refetchProfile()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
      showError('Upload Failed', 'Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }


  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Prepare analytics data
  const analyticsData = [
    { name: 'Mon', uploads: 2, views: 45, downloads: 12 },
    { name: 'Tue', uploads: 3, views: 52, downloads: 15 },
    { name: 'Wed', uploads: 1, views: 38, downloads: 8 },
    { name: 'Thu', uploads: 4, views: 65, downloads: 22 },
    { name: 'Fri', uploads: 2, views: 48, downloads: 18 },
    { name: 'Sat', uploads: 0, views: 25, downloads: 5 },
    { name: 'Sun', uploads: 1, views: 30, downloads: 7 }
  ]

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found</p>
      </div>
    )
  }

  const stats = profile.stats || {
    totalAssets: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalCollections: 0
  }

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {profile.avatar ? (
                  <ClientImage
                    src={profile.avatar}
                    alt={profile.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-gray-400" />
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleAvatarUpload(file)
                      }}
                      disabled={uploadingAvatar}
                    />
                    <CameraIcon className="w-8 h-8 text-white" />
                  </label>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profile.name || `${profile.firstName} ${profile.lastName}` || 'Unnamed User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                {profile.role && (
                  <span className="flex items-center">
                    <UserCircleIcon className="w-4 h-4 mr-1" />
                    {profile.role}
                    {profile.creativeRole && ` - ${profile.creativeRole}`}
                  </span>
                )}
                {profile.department && (
                  <span className="flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                    {profile.department}
                  </span>
                )}
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="mt-4 md:mt-0 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Profile Form */}
        {isEditing && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Listbox value={selectedCountry} onChange={setSelectedCountry}>
                <div className="relative">
                  <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </Listbox.Label>
                  <Listbox.Button className="relative w-full pl-3 pr-10 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer">
                    <span className="block truncate">{selectedCountry.name}</span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                      {countries.map((country) => (
                        <Listbox.Option
                          key={country.isoCode}
                          className={({ active }) =>
                            `${active ? 'text-white bg-primary' : 'text-gray-900 dark:text-white'}
                            cursor-pointer select-none relative py-2 pl-10 pr-4`
                          }
                          value={country}
                        >
                          {({ selected, active }) => (
                            <>
                              <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                {country.name}
                              </span>
                              {selected && (
                                <span className={`${active ? 'text-white' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                                  <CheckIcon className="h-5 w-5" />
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

              {selectedCountry && State.getStatesOfCountry(selectedCountry.isoCode).length > 0 && (
                <Listbox value={selectedState} onChange={setSelectedState}>
                  <div className="relative">
                    <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </Listbox.Label>
                    <Listbox.Button className="relative w-full pl-3 pr-10 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer">
                      <span className="block truncate">{selectedState?.name || 'Select State'}</span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                        {State.getStatesOfCountry(selectedCountry.isoCode).map((state) => (
                          <Listbox.Option
                            key={state.isoCode}
                            className={({ active }) =>
                              `${active ? 'text-white bg-primary' : 'text-gray-900 dark:text-white'}
                              cursor-pointer select-none relative py-2 pl-10 pr-4`
                            }
                            value={state}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                  {state.name}
                                </span>
                                {selected && (
                                  <span className={`${active ? 'text-white' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                                    <CheckIcon className="h-5 w-5" />
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

              {selectedState && City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).length > 0 && (
                <Listbox value={selectedCity} onChange={setSelectedCity}>
                  <div className="relative">
                    <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </Listbox.Label>
                    <Listbox.Button className="relative w-full pl-3 pr-10 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer">
                      <span className="block truncate">{selectedCity?.name || 'Select City'}</span>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto">
                        {City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode).map((city) => (
                          <Listbox.Option
                            key={city.name}
                            className={({ active }) =>
                              `${active ? 'text-white bg-primary' : 'text-gray-900 dark:text-white'}
                              cursor-pointer select-none relative py-2 pl-10 pr-4`
                            }
                            value={city}
                          >
                            {({ selected, active }) => (
                              <>
                                <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                                  {city.name}
                                </span>
                                {selected && (
                                  <span className={`${active ? 'text-white' : 'text-primary'} absolute inset-y-0 left-0 flex items-center pl-3`}>
                                    <CheckIcon className="h-5 w-5" />
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

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {!isEditing && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssets}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalViews}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDownloads}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCollections}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Collections</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'uploads', 'analytics', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="glass rounded-2xl p-6">
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
              <p className="text-gray-600 dark:text-gray-400">{profile.bio}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
              <div className="space-y-3">
                {profile.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-2">Phone:</span>
                    {profile.phone}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <LinkIcon className="w-5 h-5 mr-2" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {profile.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Uploads</h3>
              {uploadsLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              ) : uploads?.assets && uploads.assets.length > 0 ? (
                <div className="space-y-2">
                  {uploads.assets.slice(0, 3).map((asset: any) => {
                    const Icon = typeIcons[asset.type] || DocumentIcon
                    return (
                      <Link
                        key={asset.id}
                        href={`/${lng}/asset/${asset.id}`}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Icon className="w-10 h-10 text-gray-400" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {asset.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(asset.createdAt)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No uploads yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'uploads' && (
        <div className="glass rounded-2xl p-6">
          {uploadsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : uploads?.assets && uploads.assets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uploads.assets.map((asset: any) => {
                const Icon = typeIcons[asset.type] || DocumentIcon
                return (
                  <Link
                    key={asset.id}
                    href={`/${lng}/asset/${asset.id}`}
                    className="group"
                  >
                    <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
                      {asset.thumbnailUrl ? (
                        <ClientImage
                          src={asset.thumbnailUrl}
                          alt={asset.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-primary">
                      {asset.title}
                    </h3>
                    <div className="flex items-center justify-between mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(asset.createdAt)}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {asset.viewCount || 0}
                        </span>
                        <span className="flex items-center">
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          {asset.downloadCount || 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No uploads</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by uploading your first asset.
              </p>
              <div className="mt-6">
                <Link
                  href={`/${lng}/upload`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark"
                >
                  Upload Asset
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="glass rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Analytics</h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="uploads" fill="#8884d8" />
                <Bar dataKey="views" fill="#82ca9d" />
                <Bar dataKey="downloads" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          {activityLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activity?.activities && activity.activities.length > 0 ? (
            <UploadActivity lng={lng} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
        </div>
      )}
    </div>
  )
}