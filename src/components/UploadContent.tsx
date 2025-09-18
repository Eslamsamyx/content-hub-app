'use client'

import { useState, useCallback, Fragment, useEffect } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { Listbox, Transition } from '@headlessui/react'
import { useToast } from '@/contexts/ToastContext'

interface UploadContentProps {
  lng: string
}

interface FileMetadata {
  title: string
  description: string
  category: string
  department: string
  eventName: string
  productionYear: string
  tags: string[]
  readyForPublishing: boolean
  usage: 'internal' | 'public'
}

interface FileWithPreview extends File {
  preview?: string
  id?: string
  metadata?: FileMetadata
}

const assetCategories = [
  { id: 'video', name: 'Video' },
  { id: 'image', name: 'Image' },
  { id: '3d', name: '3D Model' },
  { id: 'design', name: 'Design' },
  { id: 'audio', name: 'Audio' },
  { id: 'document', name: 'Document' },
]

const departments = [
  'Marketing',
  'Creative',
  'Product',
  'Engineering',
  'Sales',
  'HR',
  'Finance',
  'Operations'
]

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
  'Salalah Tourism Festival',
  'Saudi Cup',
  'Saudi Design Week',
  'Saudi Food Expo',
  'Saudi International',
  'Saudi National Day',
  'WETEX'
].sort()

const tagCategories = {
  technical: {
    label: 'Technical',
    tags: [
      'High-Resolution',
      '4K',
      '8K',
      'HD',
      'Web-Optimized',
      'Mobile-Ready',
      'Vector',
      'Raster',
      'Animated',
      'Interactive',
      '3D-Render',
      'RAW-Format',
      'Compressed',
      'HDR',
      'Alpha-Channel'
    ]
  },
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
      'Internal-Event'
    ]
  }
}

// Custom dropdown component using Headless UI
const CustomDropdown = ({ value, onChange, options, label, placeholder, required = false, searchable = false }: {
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
  label: string
  placeholder?: string
  required?: boolean
  searchable?: boolean
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const selectedOption = options.find(opt => opt.id === value)
  
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options
  
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && '*'}
      </label>
      <Listbox value={value} onChange={(val) => { onChange(val); setSearchQuery(''); }}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 py-3 pl-4 pr-10 text-left hover:border-white/30 dark:hover:border-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20">
            <span className={`block truncate text-sm ${!selectedOption && placeholder ? 'text-gray-500' : ''}`}>
              {selectedOption?.label || placeholder || 'Select an option'}
            </span>
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
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-gray-900 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none">
              {searchable && (
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="py-1">
                {placeholder && !searchable && (
                  <Listbox.Option
                    className="relative cursor-pointer select-none py-2 pl-4 pr-4 text-sm text-gray-500"
                    value=""
                    disabled
                  >
                    {placeholder}
                  </Listbox.Option>
                )}
                {filteredOptions.length === 0 && searchable && (
                  <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
                )}
                {filteredOptions.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-4 pr-10 text-sm ${
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
                        {selected && (
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-primary">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}

// Multi-select tag component
const TagSelector = ({ selectedTags, onChange }: {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleTag = (tag: string) => {
    onChange(
      selectedTags.includes(tag)
        ? selectedTags.filter(t => t !== tag)
        : [...selectedTags, tag]
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Tags</label>
      <div className="space-y-2">
        {Object.entries(tagCategories).map(([key, category]) => (
          <div key={key} className="rounded-xl bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-white/10">
            <button
              type="button"
              onClick={() => toggleCategory(key)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors duration-200"
            >
              <span className="text-sm font-medium">{category.label}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  expandedCategories.includes(key) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedCategories.includes(key) && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {category.tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'bg-primary text-white'
                          : 'bg-white/10 hover:bg-white/20 text-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedTags.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Selected tags ({selectedTags.length}):</p>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="hover:text-red-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UploadContent({ }: UploadContentProps) {
  const { showWarning } = useToast()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFormats, setShowFormats] = useState(false)
  const [uploadMode, setUploadMode] = useState<'album' | 'individual'>('album')
  const [expandedFiles, setExpandedFiles] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    department: 'Creative',
    eventName: '',
    productionYear: new Date().getFullYear().toString(),
    readyForPublishing: false,
    usage: 'internal' as 'internal' | 'public'
  })

  // Initialize metadata when switching to individual mode
  useEffect(() => {
    if (uploadMode === 'individual') {
      setFiles(prev => prev.map(file => {
        if (!file.metadata) {
          return {
            ...file,
            metadata: {
              title: file.name.split('.')[0],
              description: '',
              category: '',
              department: 'Creative',
              eventName: '',
              productionYear: new Date().getFullYear().toString(),
              tags: [],
              readyForPublishing: false,
              usage: 'internal' as 'internal' | 'public'
            }
          }
        }
        return file
      }))
      
      // Auto-expand first file when switching to individual mode
      if (files.length > 0 && files[0].id && !expandedFiles.includes(files[0].id)) {
        setExpandedFiles([files[0].id])
      }
    }
  }, [uploadMode, files, expandedFiles])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const id = Math.random().toString(36).substr(2, 9)
      const fileWithMeta = Object.assign(file, {
        preview: URL.createObjectURL(file),
        id,
        metadata: uploadMode === 'individual' ? {
          title: file.name.split('.')[0],
          description: '',
          category: '',
          department: 'Creative',
          eventName: '',
          productionYear: new Date().getFullYear().toString(),
          tags: [],
          readyForPublishing: false,
          usage: 'internal' as 'internal' | 'public'
        } : undefined
      })
      return fileWithMeta
    })
    setFiles(prev => [...prev, ...newFiles])
  }, [uploadMode])

  const supportedFormats = {
    'Images': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.tiff', '.bmp', '.ico'],
    'Videos': ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.wmv', '.m4v'],
    'Audio': ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'],
    '3D Models': ['.glb', '.gltf', '.obj', '.fbx', '.dae', '.3ds', '.stl'],
    'Documents': ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'],
    'Design': ['.psd', '.ai', '.sketch', '.fig', '.xd', '.eps', '.indd'],
    'Other': ['.zip', '.rar', '.7z']
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': supportedFormats['Images'],
      'video/*': supportedFormats['Videos'],
      'audio/*': supportedFormats['Audio'],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf'],
      'model/obj': ['.obj'],
      'model/fbx': ['.fbx'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/postscript': ['.eps'],
      'application/x-photoshop': ['.psd'],
      'application/illustrator': ['.ai'],
      'application/x-sketch': ['.sketch'],
      'application/x-figma': ['.fig'],
      'application/x-adobe-xd': ['.xd'],
      'application/x-indesign': ['.indd'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z']
    },
    maxSize: 5 * 1024 * 1024 * 1024 // 5GB
  })

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles(files.filter(file => file !== fileToRemove))
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }
  }

  const toggleFileExpanded = (fileId: string) => {
    setExpandedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const updateFileMetadata = (fileId: string, field: keyof FileMetadata, value: string | string[] | boolean) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId && file.metadata) {
        return {
          ...file,
          metadata: {
            ...file.metadata,
            [field]: value
          }
        }
      }
      return file
    }))
  }

  const applyToAllFiles = (field: keyof FileMetadata, value: string | string[] | boolean) => {
    setFiles(prev => prev.map(file => {
      if (file.metadata) {
        return {
          ...file,
          metadata: {
            ...file.metadata,
            [field]: value
          }
        }
      }
      return file
    }))
  }

  const validateIndividualFiles = () => {
    if (uploadMode !== 'individual') return true
    return files.every(file => {
      if (!file.metadata) return false
      return file.metadata.title && file.metadata.category
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate based on mode
    if (uploadMode === 'individual' && !validateIndividualFiles()) {
      showWarning('Incomplete Information', 'Please fill in title and category for all files before uploading.')
      return
    }
    
    // Prepare files with metadata
    let filesToUpload = files
    
    if (uploadMode === 'album') {
      // In album mode, apply form data to all files
      filesToUpload = files.map(file => ({
        ...file,
        metadata: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          department: formData.department,
          eventName: formData.eventName,
          productionYear: formData.productionYear,
          tags: selectedTags,
          readyForPublishing: formData.readyForPublishing,
          usage: formData.usage
        }
      }))
    }
    
    // Log the data that would be sent
    console.log('Upload mode:', uploadMode)
    console.log('Files to upload:', filesToUpload.map(f => ({
      name: f.name,
      metadata: f.metadata
    })))
    
    // Simulate upload progress
    files.forEach((file) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        if (progress >= 100) {
          clearInterval(interval)
        }
      }, 200)
    })
  }

  return (
    <div className="relative">
      {/* Hero Section - Seamlessly integrated */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Main title */}
            <div className="relative mb-6">
              <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-bold">
                <span className="block bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient-x leading-tight">
                  Upload Assets
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Share your{' '}
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-primary/20 blur-xl rounded-lg" />
                <span className="relative font-semibold text-primary dark:text-primary px-1">creative work</span>
              </span>
              {' '}with your team and organization
            </p>
            
            {/* Stats - Minimal design matching categories page */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 max-w-4xl mx-auto mb-16">
              {[
                { 
                  value: '5GB', 
                  label: 'Max File Size', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  ),
                  color: 'text-green-500',
                  bgColor: 'bg-green-500/10'
                },
                { 
                  value: '40+', 
                  label: 'File Formats', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-500/10'
                },
                { 
                  value: 'Instant', 
                  label: 'Processing', 
                  icon: (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  color: 'text-purple-500',
                  bgColor: 'bg-purple-500/10'
                }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="group relative flex items-center space-x-4"
                  style={{ 
                    animation: 'fadeInUp 0.6s ease-out forwards',
                    animationDelay: `${index * 0.1}s`,
                    opacity: 0
                  }}
                >
                  {/* Vertical divider */}
                  {index > 0 && (
                    <div className="absolute -left-6 md:-left-8 h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-700 to-transparent" />
                  )}
                  
                  {/* Icon */}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stat.bgColor} ${stat.color} transition-all duration-300 group-hover:scale-110`}>
                    {stat.icon}
                  </div>
                  
                  {/* Text content */}
                  <div className="flex flex-col">
                    <p className={`text-2xl font-bold ${stat.color} transition-all duration-300 group-hover:scale-105`}>
                      {stat.value}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Supported Formats Dropdown */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                onClick={() => setShowFormats(!showFormats)}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 dark:bg-black/10 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">View all supported formats</span>
                <svg 
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showFormats ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {/* Formats Dropdown Content */}
            {showFormats && (
              <div className="mt-4 max-w-4xl mx-auto">
                <div className="rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-xl border border-white/10 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(supportedFormats).map(([category, formats]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold mb-2 text-gray-900 dark:text-white">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {formats.map(format => (
                            <span 
                              key={format} 
                              className="px-2 py-1 text-xs rounded-md bg-white/10 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                            >
                              {format}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                      Total: {Object.values(supportedFormats).flat().length} formats supported
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Upload Form Section - Flows naturally from hero */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Upload Mode Selection */}
          <div className="bg-white/5 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Upload Mode</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose how you want to manage metadata for your assets
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 dark:bg-black/20 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setUploadMode('album')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    uploadMode === 'album'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Album
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('individual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    uploadMode === 'individual'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Individual
                  </div>
                </button>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/5 dark:bg-black/10 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {uploadMode === 'album' 
                  ? '📁 Album Mode: All uploaded files will share the same metadata. Perfect for collections of related assets.'
                  : '📄 Individual Mode: Each file will have its own metadata. Ideal when assets have different properties.'}
              </p>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            {...getRootProps()}
            className={`relative group cursor-pointer transition-all duration-300 ${
              isDragActive ? 'scale-[1.02]' : ''
            }`}
          >
            <input {...getInputProps()} />
            
            {/* Background effects */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300 ${
              isDragActive ? 'opacity-40' : ''
            }`} />
            
            {/* Main drop zone */}
            <div className={`relative bg-white/5 dark:bg-black/10 backdrop-blur-2xl rounded-3xl border-2 border-dashed ${
              isDragActive ? 'border-primary' : 'border-white/20 dark:border-white/10'
            } p-12 text-center transition-all duration-300 hover:border-white/30 dark:hover:border-white/20`}>
              
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl animate-pulse" />
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Text */}
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                {isDragActive ? 'Drop your files here' : 'Drag & drop your assets'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                or <span className="text-primary font-medium cursor-pointer hover:underline">browse files</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Supports: Images, Videos, 3D Models, Audio, Documents • Max 5GB per file
              </p>
            </div>
          </div>


          {/* Files Preview */}
          {files.length > 0 && uploadMode === 'album' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Selected Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="relative overflow-hidden rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-xl border border-white/10 p-4">
                      <div className="flex items-center space-x-4">
                        {/* File icon/preview */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                          {file.type?.startsWith('image/') && file.preview ? (
                            <Image src={file.preview} alt={file.name} fill className="object-cover rounded-lg" />
                          ) : (
                            <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        
                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          
                          {/* Upload progress */}
                          {uploadProgress[file.name] !== undefined && (
                            <div className="mt-2">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress[file.name]}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Remove button */}
                        {!uploadProgress[file.name] && (
                          <button
                            type="button"
                            onClick={() => removeFile(file)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg hover:bg-red-500/10"
                          >
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Files with Metadata */}
          {files.length > 0 && uploadMode === 'individual' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Individual Asset Details</h3>
                <button
                  type="button"
                  onClick={() => setExpandedFiles(expandedFiles.length === files.length ? [] : files.map(f => f.id || ''))}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {expandedFiles.length === files.length ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
              <div className="space-y-4">
                {files.map((file) => {
                  const isExpanded = file.id && expandedFiles.includes(file.id)
                  const fileMetadata = file.metadata || {
                    title: file.name.split('.')[0],
                    description: '',
                    category: '',
                    department: 'Creative',
                    eventName: '',
                    productionYear: new Date().getFullYear().toString(),
                    tags: [],
                    readyForPublishing: false,
                    usage: 'internal' as 'internal' | 'public'
                  }
                  
                  return (
                    <div key={file.id} className="relative">
                      <div className="rounded-2xl bg-white/5 dark:bg-black/10 backdrop-blur-xl border border-white/10 overflow-hidden">
                        {/* File Header */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                              {/* File preview */}
                              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative">
                                {file.type?.startsWith('image/') && file.preview ? (
                                  <Image src={file.preview} alt={file.name} fill className="object-cover rounded-lg" />
                                ) : (
                                  <svg className="w-8 h-8 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              
                              {/* File info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {fileMetadata.title || file.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {fileMetadata.category && (
                                  <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    {assetCategories.find(c => c.id === fileMetadata.category)?.name || fileMetadata.category}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => file.id && toggleFileExpanded(file.id)}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                              >
                                <svg 
                                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {!uploadProgress[file.name] && (
                                <button
                                  type="button"
                                  onClick={() => removeFile(file)}
                                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                >
                                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Expanded Metadata Form */}
                        {isExpanded && file.id && (
                          <div className="border-t border-white/10 p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Title */}
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Title *</label>
                                <input
                                  type="text"
                                  value={fileMetadata.title}
                                  onChange={(e) => updateFileMetadata(file.id!, 'title', e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                  placeholder="Enter asset title"
                                  required
                                />
                              </div>

                              {/* Description */}
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                  value={fileMetadata.description}
                                  onChange={(e) => updateFileMetadata(file.id!, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                                  placeholder="Describe your asset"
                                />
                              </div>

                              {/* Category */}
                              <CustomDropdown
                                value={fileMetadata.category}
                                onChange={(value) => updateFileMetadata(file.id!, 'category', value)}
                                options={assetCategories.map(cat => ({ id: cat.id, label: cat.name }))}
                                label="Category"
                                placeholder="Select category"
                                required
                              />

                              {/* Department */}
                              <CustomDropdown
                                value={fileMetadata.department}
                                onChange={(value) => updateFileMetadata(file.id!, 'department', value)}
                                options={departments.map(dept => ({ id: dept, label: dept }))}
                                label="Department"
                                placeholder="Select department"
                              />

                              {/* Event Name */}
                              <CustomDropdown
                                value={fileMetadata.eventName}
                                onChange={(value) => updateFileMetadata(file.id!, 'eventName', value)}
                                options={[
                                  { id: '', label: 'No specific event' },
                                  ...eventNames.map(event => ({ id: event, label: event }))
                                ]}
                                label="Event Name"
                                placeholder="Select event (optional)"
                                searchable
                              />

                              {/* Production Year */}
                              <CustomDropdown
                                value={fileMetadata.productionYear}
                                onChange={(value) => updateFileMetadata(file.id!, 'productionYear', value)}
                                options={Array.from({ length: new Date().getFullYear() - 2019 + 2 }, (_, i) => {
                                  const year = new Date().getFullYear() + 1 - i
                                  return { id: year.toString(), label: year.toString() }
                                })}
                                label="Production Year"
                                placeholder="Select year"
                              />

                              {/* Tags - Full width */}
                              <div className="md:col-span-2">
                                <TagSelector 
                                  selectedTags={fileMetadata.tags}
                                  onChange={(tags) => updateFileMetadata(file.id!, 'tags', tags)}
                                />
                              </div>

                              {/* Appearance Settings */}
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-4">Appearance Settings</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => updateFileMetadata(file.id!, 'usage', 'internal')}
                                    className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                                      fileMetadata.usage === 'internal'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                        fileMetadata.usage === 'internal'
                                          ? 'border-primary bg-primary'
                                          : 'border-gray-400 dark:border-gray-600'
                                      }`}>
                                        {fileMetadata.usage === 'internal' && (
                                          <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                      </div>
                                      <div className="text-left">
                                        <p className={`text-sm font-medium ${
                                          fileMetadata.usage === 'internal' ? 'text-primary' : ''
                                        }`}>Internal Use Only</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                          Visible to team members only
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => updateFileMetadata(file.id!, 'usage', 'public')}
                                    className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                                      fileMetadata.usage === 'public'
                                        ? 'bg-primary/10 border-primary text-primary'
                                        : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                        fileMetadata.usage === 'public'
                                          ? 'border-primary bg-primary'
                                          : 'border-gray-400 dark:border-gray-600'
                                      }`}>
                                        {fileMetadata.usage === 'public' && (
                                          <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                      </div>
                                      <div className="text-left">
                                        <p className={`text-sm font-medium ${
                                          fileMetadata.usage === 'public' ? 'text-primary' : ''
                                        }`}>Public Display</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                          Visible to external viewers
                                        </p>
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              </div>

                              {/* Ready for Publishing */}
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-4">Publishing Status</label>
                                <button
                                  type="button"
                                  onClick={() => updateFileMetadata(file.id!, 'readyForPublishing', !fileMetadata.readyForPublishing)}
                                  className={`w-full relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                                    fileMetadata.readyForPublishing
                                      ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400'
                                      : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                                      fileMetadata.readyForPublishing
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-400 dark:border-gray-600'
                                    }`}>
                                      {fileMetadata.readyForPublishing && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <p className={`text-sm font-medium ${
                                        fileMetadata.readyForPublishing ? 'text-green-600 dark:text-green-400' : ''
                                      }`}>Ready for Publishing</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                        {fileMetadata.readyForPublishing 
                                          ? 'Asset is finalized and approved for public use' 
                                          : 'Asset requires further review before publishing'}
                                      </p>
                                    </div>
                                  </div>
                                  {fileMetadata.readyForPublishing && (
                                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Quick Apply Section */}
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                              <span className="text-xs text-gray-500">Apply to all:</span>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('category', fileMetadata.category)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Category
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('department', fileMetadata.department)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Department
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('eventName', fileMetadata.eventName)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Event
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('productionYear', fileMetadata.productionYear)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Year
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('tags', fileMetadata.tags)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Tags
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('usage', fileMetadata.usage)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Appearance
                              </button>
                              <button
                                type="button"
                                onClick={() => applyToAllFiles('readyForPublishing', fileMetadata.readyForPublishing)}
                                className="text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                Publishing Status
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Metadata Form */}
          {files.length > 0 && (
            <>
              {uploadMode === 'album' ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Album Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                  placeholder="Enter asset title"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-white/10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
                  placeholder="Describe your asset"
                />
              </div>

              {/* Category */}
              <CustomDropdown
                value={formData.category}
                onChange={(value) => setFormData({ ...formData, category: value })}
                options={assetCategories.map(cat => ({ id: cat.id, label: cat.name }))}
                label="Category"
                placeholder="Select category"
                required
              />

              {/* Department */}
              <CustomDropdown
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                options={departments.map(dept => ({ id: dept, label: dept }))}
                label="Department"
                placeholder="Select department"
              />

              {/* Event Name */}
              <CustomDropdown
                value={formData.eventName}
                onChange={(value) => setFormData({ ...formData, eventName: value })}
                options={[
                  { id: '', label: 'No specific event' },
                  ...eventNames.map(event => ({ id: event, label: event }))
                ]}
                label="Event Name"
                placeholder="Select event (optional)"
                searchable
              />

              {/* Production Year */}
              <CustomDropdown
                value={formData.productionYear}
                onChange={(value) => setFormData({ ...formData, productionYear: value })}
                options={Array.from({ length: new Date().getFullYear() - 2019 + 2 }, (_, i) => {
                  const year = new Date().getFullYear() + 1 - i
                  return { id: year.toString(), label: year.toString() }
                })}
                label="Production Year"
                placeholder="Select year"
              />

              {/* Tags - Full width */}
              <div className="md:col-span-2">
                <TagSelector 
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              </div>

              {/* Appearance Settings */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-4">Appearance Settings</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, usage: 'internal' })}
                    className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      formData.usage === 'internal'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        formData.usage === 'internal'
                          ? 'border-primary bg-primary'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {formData.usage === 'internal' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${
                          formData.usage === 'internal' ? 'text-primary' : ''
                        }`}>Internal Use Only</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Visible to team members only
                        </p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, usage: 'public' })}
                    className={`relative flex items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                      formData.usage === 'public'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        formData.usage === 'public'
                          ? 'border-primary bg-primary'
                          : 'border-gray-400 dark:border-gray-600'
                      }`}>
                        {formData.usage === 'public' && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${
                          formData.usage === 'public' ? 'text-primary' : ''
                        }`}>Public Display</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Visible to external viewers
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ready for Publishing */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-4">Publishing Status</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, readyForPublishing: !formData.readyForPublishing })}
                  className={`w-full relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    formData.readyForPublishing
                      ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400'
                      : 'bg-white/5 dark:bg-black/20 border-white/10 hover:border-white/20 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                      formData.readyForPublishing
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-400 dark:border-gray-600'
                    }`}>
                      {formData.readyForPublishing && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${
                        formData.readyForPublishing ? 'text-green-600 dark:text-green-400' : ''
                      }`}>Ready for Publishing</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        {formData.readyForPublishing 
                          ? 'Asset is finalized and approved for public use' 
                          : 'Asset requires further review before publishing'}
                      </p>
                    </div>
                  </div>
                  {formData.readyForPublishing && (
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
              ) : (
                <div className="bg-white/5 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Individual Asset Details</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        In individual mode, each file has its own metadata. Click on any file above to expand and fill in its details.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Click the arrow to expand</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                          </svg>
                          <span>Required: Title & Category</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          <span>Use &quot;Apply to all&quot; for common values</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 rounded-xl border border-white/20 hover:bg-white/5 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={files.length === 0 || (uploadMode === 'album' ? (!formData.title || !formData.category) : !validateIndividualFiles())}
              className={`relative group px-8 py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 via-primary to-cyan-600 transition-all duration-300 transform ${
                files.length === 0 || (uploadMode === 'album' ? (!formData.title || !formData.category) : !validateIndividualFiles())
                  ? 'opacity-40 cursor-not-allowed text-white/70'
                  : 'opacity-100 text-white hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 cursor-pointer animate-gradient-x bg-[length:200%_auto]'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {files.length === 0 || (uploadMode === 'album' ? (!formData.title || !formData.category) : !validateIndividualFiles()) ? (
                  <>
                    <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="opacity-90">Upload Assets</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Assets</span>
                  </>
                )}
              </span>
              <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                files.length === 0 || (uploadMode === 'album' ? (!formData.title || !formData.category) : !validateIndividualFiles())
                  ? ''
                  : 'bg-gradient-to-r from-violet-600/20 via-primary/20 to-cyan-600/20 blur-xl group-hover:blur-2xl'
              }`} />
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}