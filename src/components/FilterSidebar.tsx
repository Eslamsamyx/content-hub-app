'use client'

import { useState, useEffect, Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'

interface FilterSidebarProps {
  translations: {
    filters: {
      all: string
      type: string
      date: string
      department: string
      tags: string
      year: string
      company: string
    }
  }
  onFilterChange: (filters: {
    type: string
    date: string
    department: string
    year: string
    company: string
    readyForPublishing?: boolean
  }) => void
  preselectedType?: string
}

export default function FilterSidebar({ translations, onFilterChange, preselectedType }: FilterSidebarProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(preselectedType ? [preselectedType] : [])
  const [selectedDate, setSelectedDate] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedCompany, setSelectedCompany] = useState('all')
  const [readyForPublishing, setReadyForPublishing] = useState<boolean | undefined>(undefined)

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
  ]

  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
  ]

  const departments = [
    { id: 'all', label: 'All Departments' },
    { id: 'Marketing', label: 'Marketing' },
    { id: 'Creative', label: 'Creative' },
    { id: 'Brand', label: 'Brand' },
    { id: 'Product', label: 'Product' },
    { id: 'Sales', label: 'Sales' },
    { id: 'HR', label: 'HR' },
    { id: 'L&D', label: 'L&D' },
    { id: 'Events', label: 'Events' },
    { id: 'Architecture', label: 'Architecture' },
    { id: '3D', label: '3D' },
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

  const handleFilterChange = () => {
    onFilterChange({
      type: selectedTypes.length === 0 ? 'all' : selectedTypes.join(','),
      date: selectedDate,
      department: selectedDept,
      year: selectedYear,
      company: selectedCompany,
      readyForPublishing: readyForPublishing,
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

  useEffect(() => {
    handleFilterChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedDate, selectedDept, selectedYear, selectedCompany, readyForPublishing])

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
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="w-64 glass rounded-xl p-6 h-fit">
      <h3 className="text-lg font-semibold mb-6">Filters</h3>
      
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

      {/* Department */}
      <div className="mb-6">
        <CustomDropdown
          value={selectedDept}
          onChange={setSelectedDept}
          options={departments}
          label={translations.filters.department}
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

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSelectedTypes([])
          setSelectedDate('all')
          setSelectedDept('all')
          setSelectedYear('all')
          setSelectedCompany('all')
          setReadyForPublishing(undefined)
        }}
        className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  )
}