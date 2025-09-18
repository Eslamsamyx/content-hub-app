'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useUsers, useUpdateUser, useDeleteUser, useActivateUser } from '@/hooks/use-api'
import { useSession } from 'next-auth/react'
import { useToast } from '@/contexts/ToastContext'
import AdminCustomDropdown from './AdminCustomDropdown'

interface UserManagementConnectedProps {
  lng: string
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CONTENT_MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  CREATIVE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  REVIEWER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UserManagementConnected({ lng }: UserManagementConnectedProps) {
  const { data: session } = useSession()
  const { showSuccess, showError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [modalRole, setModalRole] = useState('USER')
  
  const { data: usersData, loading, refetch } = useUsers({
    search: searchTerm || undefined,
    role: selectedRole !== 'all' ? selectedRole : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    page: currentPage,
    limit: 10
  })

  const { mutate: updateUser } = useUpdateUser()
  const { mutate: deleteUser } = useDeleteUser()
  const { mutate: toggleUserStatus } = useActivateUser()

  const users = usersData?.users || []
  const totalPages = usersData?.totalPages || 1

  const handleEditUser = (user: any) => {
    setSelectedUser(user)
    setModalRole(user.role)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      await updateUser({ userId, data })
      setShowEditModal(false)
      showSuccess('User Updated', 'User information has been successfully updated.')
      refetch()
    } catch (error) {
      console.error('Failed to update user:', error)
      showError('Update Failed', 'Failed to update user information. Please try again.')
    }
  }

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      await toggleUserStatus({ userId, activate: currentStatus !== 'active' })
      const action = currentStatus !== 'active' ? 'activated' : 'deactivated'
      showSuccess('Status Changed', `User has been successfully ${action}.`)
      refetch()
    } catch (error) {
      console.error('Failed to toggle user status:', error)
      showError('Status Change Failed', 'Failed to change user status. Please try again.')
    }
  }

  const confirmDeleteUser = (user: any) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await deleteUser(userToDelete.id)
      showSuccess('User Deleted', `${userToDelete.firstName} ${userToDelete.lastName} has been successfully deleted.`)
      setShowDeleteModal(false)
      setUserToDelete(null)
      refetch()
    } catch (error) {
      console.error('Failed to delete user:', error)
      showError('Deletion Failed', 'Failed to delete user. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-all duration-200"
          />
        </div>
        <AdminCustomDropdown
          value={selectedRole}
          onChange={setSelectedRole}
          options={[
            { value: "all", label: "All Roles" },
            { value: "ADMIN", label: "Admin" },
            { value: "CONTENT_MANAGER", label: "Content Manager" },
            { value: "CREATIVE", label: "Creative" },
            { value: "REVIEWER", label: "Reviewer" },
            { value: "USER", label: "User" }
          ]}
          width="w-48"
          aria-label="Filter by role"
        />
        <AdminCustomDropdown
          value={selectedStatus}
          onChange={setSelectedStatus}
          options={[
            { value: "all", label: "All Status" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" }
          ]}
          width="w-40"
          aria-label="Filter by status"
        />
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105">
          <PlusIcon className="h-5 w-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user: any) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {user.avatar ? (
                        <ClientImage className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role] || roleColors.USER}`}>
                    {user.role}
                  </span>
                  {user.creativeRole && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({user.creativeRole})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.status)}
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                    disabled={user.id === session?.user?.id}
                  >
                    {user.status === 'active' ? (
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircleIcon className="w-3 h-3 mr-1" />
                    )}
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-primary hover:text-primary-dark mr-3"
                    disabled={user.id === session?.user?.id && user.role !== 'ADMIN'}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => confirmDeleteUser(user)}
                    className="text-red-600 hover:text-red-900"
                    disabled={user.id === session?.user?.id}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-700 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Edit User
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleUpdateUser(selectedUser.id, {
                role: modalRole,
                department: formData.get('department')
              })
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <AdminCustomDropdown
                    value={modalRole}
                    onChange={setModalRole}
                    options={[
                      { value: "ADMIN", label: "Admin" },
                      { value: "CONTENT_MANAGER", label: "Content Manager" },
                      { value: "CREATIVE", label: "Creative" },
                      { value: "REVIEWER", label: "Reviewer" },
                      { value: "USER", label: "User" }
                    ]}
                    className="mt-1"
                    width="w-full"
                    aria-label="Select role"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    defaultValue={selectedUser.department || ''}
                    className="mt-1 block w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 hover:bg-white/15 transition-all duration-200"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Delete User Account
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete the user account for{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {userToDelete.firstName} {userToDelete.lastName}
                </span>
                ?
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Email: <span className="font-medium">{userToDelete.email}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Role: <span className="font-medium">{userToDelete.role}</span>
              </p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Warning
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>This action cannot be undone. All of the user&apos;s data will be permanently deleted, including:</p>
                    <ul className="list-disc list-inside mt-1">
                      <li>Profile information</li>
                      <li>Uploaded assets</li>
                      <li>Collections</li>
                      <li>Activity history</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  setUserToDelete(null)
                }}
                className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}