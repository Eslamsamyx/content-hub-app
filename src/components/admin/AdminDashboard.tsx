'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  UsersIcon, 
  FolderIcon, 
  ChartBarIcon, 
  CogIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  CloudArrowUpIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import UserManagement from './UserManagement'
import SystemSettingsRefactored from './SystemSettingsRefactored'
import ContentManagement from './ContentManagement'
import SystemHealth from './SystemHealth'

const tabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'users', name: 'User Management', icon: UsersIcon },
  { id: 'content', name: 'Content', icon: FolderIcon },
  { id: 'settings', name: 'Settings', icon: CogIcon },
  { id: 'health', name: 'System Health', icon: ServerIcon }
]

const overviewStats = [
  {
    name: 'Total Users',
    value: '1,247',
    change: '+12.5%',
    changeType: 'positive',
    icon: UsersIcon,
    color: 'from-blue-500 to-blue-600'
  },
  {
    name: 'Total Assets',
    value: '18,432',
    change: '+8.2%',
    changeType: 'positive',
    icon: FolderIcon,
    color: 'from-green-500 to-green-600'
  },
  {
    name: 'Storage Used',
    value: '2.4 TB',
    change: '+15.3%',
    changeType: 'positive',
    icon: CloudArrowUpIcon,
    color: 'from-purple-500 to-purple-600'
  },
  {
    name: 'Active Sessions',
    value: '342',
    change: '-2.1%',
    changeType: 'negative',
    icon: ArrowTrendingUpIcon,
    color: 'from-orange-500 to-orange-600'
  }
]

const recentActivity = [
  {
    id: 1,
    user: 'Sarah Johnson',
    action: 'uploaded 15 new images',
    timestamp: '2 minutes ago',
    type: 'upload'
  },
  {
    id: 2,
    user: 'Mike Chen',
    action: 'created new collection "Product Launch"',
    timestamp: '5 minutes ago',
    type: 'collection'
  },
  {
    id: 3,
    user: 'Emma Wilson',
    action: 'shared album with team',
    timestamp: '12 minutes ago',
    type: 'share'
  },
  {
    id: 4,
    user: 'James Rodriguez',
    action: 'updated user permissions',
    timestamp: '18 minutes ago',
    type: 'admin'
  },
  {
    id: 5,
    user: 'Lisa Anderson',
    action: 'downloaded 25 assets',
    timestamp: '25 minutes ago',
    type: 'download'
  }
]

const systemAlerts = [
  {
    id: 1,
    type: 'warning',
    message: 'Storage usage is approaching 80% capacity',
    timestamp: '1 hour ago'
  },
  {
    id: 2,
    type: 'info',
    message: 'Scheduled maintenance in 2 days',
    timestamp: '3 hours ago'
  },
  {
    id: 3,
    type: 'success',
    message: 'Backup completed successfully',
    timestamp: '6 hours ago'
  }
]

export default function AdminDashboard({ }: { lng: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')

  // Initialize active tab from URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    const currentPath = window.location.pathname
    router.push(`${currentPath}?tab=${tabId}`, { scroll: false })
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />
      case 'content':
        return <ContentManagement />
      case 'settings':
        return <SystemSettingsRefactored />
      case 'health':
        return <SystemHealth />
      default:
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat) => (
                <div key={stat.name} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm font-medium">{stat.name}</p>
                      <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/10">
                      <stat.icon className="w-6 h-6 text-white/70" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-white/60 text-sm ml-2">from last month</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
                        {activity.user.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        <p className="text-white/60 text-xs">{activity.timestamp}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'upload' ? 'bg-green-500' :
                        activity.type === 'collection' ? 'bg-blue-500' :
                        activity.type === 'share' ? 'bg-purple-500' :
                        activity.type === 'admin' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* System Alerts */}
              <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">System Alerts</h3>
                  <BellIcon className="w-5 h-5 text-white/70" />
                </div>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className={`p-1 rounded-full ${
                        alert.type === 'warning' ? 'bg-yellow-500/20' :
                        alert.type === 'info' ? 'bg-blue-500/20' :
                        'bg-green-500/20'
                      }`}>
                        <ExclamationTriangleIcon className={`w-4 h-4 ${
                          alert.type === 'warning' ? 'text-yellow-400' :
                          alert.type === 'info' ? 'text-blue-400' :
                          'text-green-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{alert.message}</p>
                        <p className="text-white/60 text-xs mt-1">{alert.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <UsersIcon className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <span className="text-white text-sm font-medium">Add User</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <FolderIcon className="w-8 h-8 text-green-400 group-hover:text-green-300 transition-colors" />
                  <span className="text-white text-sm font-medium">Create Collection</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <ShieldCheckIcon className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  <span className="text-white text-sm font-medium">Security Settings</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <CloudArrowUpIcon className="w-8 h-8 text-orange-400 group-hover:text-orange-300 transition-colors" />
                  <span className="text-white text-sm font-medium">Backup Data</span>
                </button>
                <button className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <ChartBarIcon className="w-8 h-8 text-teal-400 group-hover:text-teal-300 transition-colors" />
                  <span className="text-white text-sm font-medium">View Reports</span>
                </button>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
        <p className="text-white/70 text-lg">Manage users, content, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 p-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}