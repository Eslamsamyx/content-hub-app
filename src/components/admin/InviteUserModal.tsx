'use client'

import { useState } from 'react'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import AdminCustomDropdown from './AdminCustomDropdown'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onInvite: (data: InviteFormData) => void
}

interface InviteFormData {
  email: string
  firstName: string
  lastName: string
  role: string
  department: string
  message: string
}

const roles = ['Admin', 'Editor', 'Viewer']
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

export default function InviteUserModal({ isOpen, onClose, onInvite }: InviteUserModalProps) {
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'Viewer',
    department: '',
    message: `Welcome to Content Hub! You've been invited to join our team. Please click the link below to complete your registration and set up your account.

We're excited to have you on board!`
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<InviteFormData>>({})

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})

    // Validation
    const newErrors: Partial<InviteFormData> = {}
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.department) newErrors.department = 'Department is required'

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    // Simulate API call
    setTimeout(() => {
      onInvite(formData)
      setIsLoading(false)
      resetForm()
    }, 1500)
  }

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'Viewer',
      department: '',
      message: `Welcome to Content Hub! You've been invited to join our team. Please click the link below to complete your registration and set up your account.

We're excited to have you on board!`
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Invite New User</h3>
            <button
              onClick={handleClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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
                } rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="john.doe@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

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

            {/* Role and Department */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-white/90 mb-2">
                  Role
                </label>
                <AdminCustomDropdown
                  value={formData.role}
                  onChange={(role) => setFormData({ ...formData, role })}
                  options={roles.map(role => ({ value: role, label: role }))}
                  width="w-full"
                  aria-label="Select role"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-white/90 mb-2">
                  Department
                </label>
                <AdminCustomDropdown
                  value={formData.department}
                  onChange={(department) => setFormData({ ...formData, department })}
                  options={[
                    { value: "", label: "Select department" },
                    ...departments.map(dept => ({ value: dept, label: dept }))
                  ]}
                  width="w-full"
                  placeholder="Select department"
                  aria-label="Select department"
                  className={errors.department ? 'border-red-400' : ''}
                />
                {errors.department && (
                  <p className="mt-1 text-sm text-red-400">{errors.department}</p>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-white/90 mb-2">
                Invitation Message
              </label>
              <textarea
                id="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Add a personal message to the invitation..."
              />
            </div>

            {/* Permission Preview */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <h4 className="text-sm font-medium text-white/90 mb-2">User will have access to:</h4>
              <div className="space-y-1 text-sm text-white/70">
                {formData.role === 'Admin' && (
                  <>
                    <div>• Full administrative access</div>
                    <div>• User management</div>
                    <div>• System settings</div>
                    <div>• All content operations</div>
                  </>
                )}
                {formData.role === 'Editor' && (
                  <>
                    <div>• Upload and edit content</div>
                    <div>• Manage collections</div>
                    <div>• Download assets</div>
                    <div>• Share content</div>
                  </>
                )}
                {formData.role === 'Viewer' && (
                  <>
                    <div>• View and browse content</div>
                    <div>• Download approved assets</div>
                    <div>• Basic search functionality</div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}