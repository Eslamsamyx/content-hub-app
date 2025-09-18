'use client'

import { useState } from 'react'
import ClientImage from '@/components/common/ClientImage'
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import InviteUserModal from './InviteUserModal'

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  joinDate: string
  avatar: string
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Admin',
    department: 'Marketing',
    status: 'active',
    lastActive: '2 minutes ago',
    joinDate: '2023-01-15',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c4e8a8ec?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    role: 'Editor',
    department: 'Design',
    status: 'active',
    lastActive: '1 hour ago',
    joinDate: '2023-02-20',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    email: 'emma.wilson@company.com',
    role: 'Viewer',
    department: 'Sales',
    status: 'inactive',
    lastActive: '3 days ago',
    joinDate: '2023-03-10',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'James Rodriguez',
    email: 'james.rodriguez@company.com',
    role: 'Admin',
    department: 'Engineering',
    status: 'active',
    lastActive: '30 minutes ago',
    joinDate: '2022-11-05',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@company.com',
    role: 'Editor',
    department: 'Marketing',
    status: 'pending',
    lastActive: 'Never',
    joinDate: '2024-01-25',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face'
  }
]

const roles = ['Admin', 'Editor', 'Viewer']
const statuses = ['active', 'inactive', 'pending']

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'email':
        return a.email.localeCompare(b.email)
      case 'role':
        return a.role.localeCompare(b.role)
      case 'department':
        return a.department.localeCompare(b.department)
      case 'joinDate':
        return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
      default:
        return 0
    }
  })

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'Editor':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Viewer':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder={searchFocused || searchQuery ? "" : "Search users..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
          />
        </div>

        {/* Filters */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          <option value="all" className="bg-gray-900 text-white">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role} className="bg-gray-900 text-white">{role}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          <option value="all" className="bg-gray-900 text-white">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status} className="bg-gray-900 text-white">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        >
          <option value="name" className="bg-gray-900 text-white">Sort by Name</option>
          <option value="email" className="bg-gray-900 text-white">Sort by Email</option>
          <option value="role" className="bg-gray-900 text-white">Sort by Role</option>
          <option value="department" className="bg-gray-900 text-white">Sort by Department</option>
          <option value="joinDate" className="bg-gray-900 text-white">Sort by Join Date</option>
        </select>

        {/* Invite User Button */}
        <button 
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02]"
        >
          <PlusIcon className="w-5 h-5" />
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-white/90 font-medium">User</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Role</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Department</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Status</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Last Active</th>
                <th className="text-left px-6 py-4 text-white/90 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden relative">
                        <ClientImage
                          src={user.avatar}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name}</div>
                        <div className="text-white/60 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/80">{user.department}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value as User['status'])}
                      className={`px-3 py-1 rounded-lg text-sm font-medium border bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 ${getStatusColor(user.status)}`}
                    >
                      <option value="active" className="bg-gray-900 text-white">Active</option>
                      <option value="inactive" className="bg-gray-900 text-white">Inactive</option>
                      <option value="pending" className="bg-gray-900 text-white">Pending</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">{user.lastActive}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-white/70 text-sm">Total Users</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-white/70 text-sm">Active Users</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {users.filter(u => u.status === 'pending').length}
          </div>
          <div className="text-white/70 text-sm">Pending Users</div>
        </div>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {users.filter(u => u.role === 'Admin').length}
          </div>
          <div className="text-white/70 text-sm">Administrators</div>
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={(inviteData) => {
            console.log('Sending invitation:', inviteData)
            setShowInviteModal(false)
            // Handle successful invitation
          }}
        />
      )}
    </div>
  )
}