'use client'

import { useState, useEffect, Fragment } from 'react'
import { Listbox, Transition, Disclosure } from '@headlessui/react'
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface AdvancedFilterSidebarProps {
  translations: {
    filters: {
      all: string
      type: string
      date: string
      tags: string
      year: string
      company: string
    }
  }
  onFilterChange: (filters: {
    types: string[]
    eventName: string
    usage: string
    readyForPublishing: boolean
    dateRange: { start: string; end: string } | null
    year: string
    company: string
    tags: string[]
  }) => void
  preselectedType?: string
}

// Import all the event names and tag categories from upload component
const eventNames = [
  'Abu Dhabi International Book Fair',
  'ADIPEC',
  'AlUla Season',
  'Arab Health',
  'Arabian Travel Market',
  'Art Dubai',
  'Bahrain International Airshow',
  'Bahrain National Day',
  'Big 5 Global',
  'CABSAT',
  'Cityscape Global',
  'Diriyah E-Prix',
  'Doha Forum',
  'Doha Jewellery and Watches Exhibition',
  'Dubai Airshow',
  'Dubai Design Week',
  'Dubai International Boat Show',
  'Dubai Shopping Festival',
  'Dubai World Cup',
  'Eid Campaign',
  'Formula 1 Abu Dhabi',
  'Formula 1 Bahrain Grand Prix',
  'Future Investment Initiative',
  'GCC Summit',
  'GITEX Global',
  'Gulf Industry Fair',
  'Gulf Information Security Expo',
  'Gulfood',
  'Hajj Season',
  'Hotel Show Dubai',
  'INDEX Dubai',
  'Intersec Dubai',
  'Jeddah Season',
  'Jewellery Arabia',
  'Kuwait Aviation Show',
  'Kuwait International Fair',
  'Kuwait Motor Show',
  'Kuwait National Day',
  'LEAP',
  'MDL Beast',
  'Middle East Film Comic Con',
  'Muscat Festival',
  'National Day UAE',
  'Oman International Rally',
  'Oman National Day',
  'Qatar International Boat Show',
  'Qatar International Food Festival',
  'Qatar Motor Show',
  'Qatar National Day',
  'Ramadan Campaign',
  'Riyadh Season',
  'Saudi Cup',
  'Saudi National Day',
  'Summer Campaign',
  'UAE National Day',
  'Winter at Tantora',
  'World Defense Show',
  'Year of Arabic Calligraphy',
  'Other'
]

const tagCategories = {
  contentType: {
    label: 'Content Type',
    tags: [
      'Stock',
      'Custom',
      'Template',
      'Final',
      'Draft',
      'Raw',
      'Edited',
      'Original',
      'Variant',
      'Master-File',
      'Derivative',
      'Archive'
    ]
  },
  industry: {
    label: 'Industry/Sector',
    tags: [
      'Technology',
      'Healthcare',
      'Finance',
      'Banking',
      'Insurance',
      'Education',
      'Retail',
      'E-commerce',
      'Real-Estate',
      'Hospitality',
      'Tourism',
      'Manufacturing',
      'Energy',
      'Oil-Gas',
      'Renewable-Energy',
      'Telecom',
      'Media',
      'Entertainment',
      'Government',
      'Non-Profit',
      'Automotive',
      'Aviation',
      'Maritime',
      'Construction',
      'FMCG'
    ]
  },
  campaign: {
    label: 'Campaign/Project',
    tags: [
      'Social-Media',
      'Print',
      'Digital',
      'Email-Marketing',
      'SMS-Campaign',
      'Billboard',
      'TV-Commercial',
      'Radio',
      'Podcast',
      'Webinar',
      'Product-Launch',
      'Brand-Awareness',
      'Lead-Generation',
      'Seasonal',
      'Holiday',
      'Black-Friday',
      'Ramadan',
      'National-Day',
      'Year-End'
    ]
  },
  eventType: {
    label: 'Event Type',
    tags: [
      'Tradeshow',
      'Exhibition',
      'Conference',
      'Summit',
      'Workshop',
      'Seminar',
      'Webinar',
      'Product-Launch',
      'Gala-Dinner',
      'Awards-Ceremony',
      'Festival',
      'Concert',
      'Sports-Event',
      'Corporate-Meeting',
      'AGM',
      'Roadshow',
      'Pop-Up',
      'Virtual-Event',
      'Hybrid-Event'
    ]
  },
  audience: {
    label: 'Target Audience',
    tags: [
      'B2B',
      'B2C',
      'B2G',
      'Government',
      'Enterprise',
      'SME',
      'Startup',
      'Consumer',
      'Professional',
      'Student',
      'Investor',
      'Partner',
      'Employee',
      'Stakeholder',
      'Media',
      'VIP',
      'General-Public'
    ]
  },
  region: {
    label: 'Region',
    tags: [
      'UAE',
      'Dubai',
      'Abu-Dhabi',
      'Sharjah',
      'KSA',
      'Riyadh',
      'Jeddah',
      'Dammam',
      'Qatar',
      'Doha',
      'Kuwait',
      'Bahrain',
      'Oman',
      'Egypt',
      'Cairo',
      'Jordan',
      'Lebanon',
      'GCC',
      'MENA',
      'Middle-East',
      'North-Africa',
      'Global',
      'Asia',
      'Europe',
      'Americas'
    ]
  },
  organizer: {
    label: 'Event Organizer',
    tags: [
      'DWTC',
      'ADNEC',
      'Expo-Centre-Sharjah',
      'Informa',
      'Reed-Exhibitions',
      'Messe-Frankfurt',
      'DMG-Events',
      'IIR-Middle-East',
      'Tarsus-Group',
      'Koelnmesse',
      'UBM',
      'Clarion-Events',
      'ITE-Group',
      'MCH-Group',
      'Fiera-Milano',
      'DICEC',
      'QNE',
      'Omanexpo',
      'BIEC',
      'SIEC',
      'Internal-Team',
      'Partner-Agency',
      'Client-Direct'
    ]
  }
}

export default function AdvancedFilterSidebar({ translations, onFilterChange, preselectedType }: AdvancedFilterSidebarProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(preselectedType ? [preselectedType] : [])
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [selectedEventName, setSelectedEventName] = useState('all')
  const [selectedUsage, setSelectedUsage] = useState('all')
  const [readyForPublishing, setReadyForPublishing] = useState<boolean | undefined>(undefined)
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const fileTypes = [
    { 
      id: 'video', 
      label: 'Videos', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      id: 'image', 
      label: 'Images', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ) 
    },
    { 
      id: '3d', 
      label: '3D Models', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ) 
    },
    { 
      id: 'design', 
      label: 'Designs', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ) 
    },
    { 
      id: 'document', 
      label: 'Documents', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ) 
    },
    { 
      id: 'audio', 
      label: 'Audio', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ) 
    },
    {
      id: 'archive',
      label: 'Archives',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    }
  ]

  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ]

  const productionYears = [
    { id: 'all', label: 'All Years' },
    { id: '2025', label: '2025' },
    { id: '2024', label: '2024' },
    { id: '2023', label: '2023' },
    { id: '2022', label: '2022' },
    { id: '2021', label: '2021' },
    { id: '2020', label: '2020' },
    { id: '2019', label: '2019' },
  ]

  const companies = [
    { id: 'all', label: 'All Companies' },
    { id: 'Internal', label: 'Internal' },
    { id: 'STC', label: 'STC' },
    { id: 'Aramco', label: 'Aramco' },
    { id: 'SABIC', label: 'SABIC' },
    { id: 'Mobily', label: 'Mobily' },
    { id: 'Al Rajhi Bank', label: 'Al Rajhi Bank' },
    { id: 'Flynas', label: 'Flynas' },
    { id: 'Neom', label: 'Neom' },
  ]

  const usageOptions = [
    { id: 'all', label: 'All Usage' },
    { id: 'internal', label: 'Internal Only' },
    { id: 'public', label: 'Public' }
  ]

  const handleFilterChange = () => {
    // Flatten selectedTags to a single array
    const flattenedTags = Object.values(selectedTags).flat()
    
    onFilterChange({
      types: selectedTypes.length === 0 ? ['all'] : selectedTypes,
      eventName: selectedEventName,
      usage: selectedUsage,
      readyForPublishing: readyForPublishing ?? false,
      dateRange: null,
      year: selectedYear,
      company: selectedCompany,
      tags: flattenedTags
    })
  }

  const handleTypeToggle = (typeId: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(t => t !== typeId)
      } else {
        return [...prev, typeId]
      }
    })
  }

  const handleTagToggle = (category: string, tag: string) => {
    setSelectedTags(prev => {
      const categoryTags = prev[category] || []
      if (categoryTags.includes(tag)) {
        return {
          ...prev,
          [category]: categoryTags.filter(t => t !== tag)
        }
      } else {
        return {
          ...prev,
          [category]: [...categoryTags, tag]
        }
      }
    })
  }

  useEffect(() => {
    handleFilterChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedDate, selectedYear, selectedCompany, selectedEventName, selectedUsage, readyForPublishing, selectedTags])

  // Custom dropdown component using Headless UI
  interface DropdownOption {
    id: string
    label: string
  }
  
  interface CustomDropdownProps {
    value: string
    onChange: (value: string) => void
    options: DropdownOption[]
    label: string
  }
  
  const CustomDropdown = ({ value, onChange, options, label }: CustomDropdownProps) => {
    const selectedOption = options.find((opt) => opt.id === value)
    
    return (
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </Listbox.Label>
          <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/10 py-3 pl-4 pr-10 text-left hover:border-white/30 dark:hover:border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50">
            <span className="block truncate text-sm">{selectedOption?.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none py-1">
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-4 pr-4 text-sm ${
                      active ? 'bg-primary/10 text-primary' : 'text-gray-900 dark:text-gray-100'
                    }`
                  }
                  value={option.id}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    )
  }

  return (
    <div className="w-full glass rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            Filters
          </h3>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
          >
            <FunnelIcon className="w-4 h-4" />
            {showAdvancedFilters ? 'Simple' : 'Advanced'}
          </button>
        </div>
        
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 -mr-2 custom-scrollbar">
      
      {/* File Type */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {translations.filters.type}
          <span className="text-xs text-gray-500 ml-2">({selectedTypes.length} selected)</span>
        </h4>
        <div className="space-y-2">
          {fileTypes.map((type) => (
            <label
              key={type.id}
              className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                value={type.id}
                checked={selectedTypes.includes(type.id)}
                onChange={() => handleTypeToggle(type.id)}
                className="w-4 h-4 text-primary bg-white/10 border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2"
              />
              <span className="text-gray-600 dark:text-gray-400">{type.icon}</span>
              <span className="text-sm">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Basic Filters */}
      
      {/* Date Range */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedDate}
          onChange={setSelectedDate}
          options={dateRanges}
          label={translations.filters.date}
        />
      </div>

      {/* Production Year */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedYear}
          onChange={setSelectedYear}
          options={productionYears}
          label="Production Year"
        />
      </div>

      {/* Company */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedCompany}
          onChange={setSelectedCompany}
          options={companies}
          label={translations.filters.company}
        />
      </div>

      {/* Event Name */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedEventName}
          onChange={setSelectedEventName}
          options={[
            { id: 'all', label: 'All Events' },
            ...eventNames.map(name => ({ id: name, label: name }))
          ]}
          label="Event Name"
        />
      </div>

      {/* Usage */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedUsage}
          onChange={setSelectedUsage}
          options={usageOptions}
          label="Usage Rights"
        />
      </div>

      {/* Ready for Publishing */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Publishing Status
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
            <input
              type="radio"
              name="publishingStatus"
              value="all"
              checked={readyForPublishing === undefined}
              onChange={() => setReadyForPublishing(undefined)}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm">All Assets</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
            <input
              type="radio"
              name="publishingStatus"
              value="ready"
              checked={readyForPublishing === true}
              onChange={() => setReadyForPublishing(true)}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ready for Publishing
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
            <input
              type="radio"
              name="publishingStatus"
              value="notReady"
              checked={readyForPublishing === false}
              onChange={() => setReadyForPublishing(false)}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Not Ready
            </span>
          </label>
        </div>
      </div>

      {/* Advanced Filters - Tag Categories */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Advanced Tag Filters
          </h4>
          
          {Object.entries(tagCategories).map(([key, category]) => (
            <Disclosure key={key} as="div" className="mb-4">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-gray-900 dark:text-gray-100 bg-white/10 dark:bg-black/20 rounded-lg hover:bg-white/20 dark:hover:bg-black/30 focus:outline-none focus-visible:ring focus-visible:ring-primary focus-visible:ring-opacity-75">
                    <span>{category.label}</span>
                    <span className="flex items-center gap-2">
                      {selectedTags[key]?.length > 0 && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {selectedTags[key].length}
                        </span>
                      )}
                      {open ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </span>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-2 pt-2 pb-2">
                    <div className="grid grid-cols-2 gap-2">
                      {category.tags.map((tag) => (
                        <label
                          key={tag}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 p-1.5 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags[key]?.includes(tag) || false}
                            onChange={() => handleTagToggle(key, tag)}
                            className="w-3 h-3 text-primary bg-white/10 border-gray-300 dark:border-gray-600 rounded focus:ring-primary focus:ring-2"
                          />
                          <span className="text-xs">{tag}</span>
                        </label>
                      ))}
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      )}

        </div>
        
        {/* Clear Filters - Outside scrollable area */}
        <button
          onClick={() => {
            setSelectedTypes([])
            setSelectedDate('all')
            setSelectedYear('all')
            setSelectedCompany('all')
            setSelectedEventName('all')
            setSelectedUsage('all')
            setReadyForPublishing(undefined)
            setSelectedTags({})
          }}
          className="w-full py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 mt-4"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  )
}