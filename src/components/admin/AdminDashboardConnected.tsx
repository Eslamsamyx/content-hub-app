'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  UsersIcon, 
  FolderIcon, 
  ChartBarIcon, 
  CogIcon, 
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  ServerIcon,
  ShieldCheckIcon,
  BellIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import UserManagementConnected from './UserManagementConnected'
import SystemSettingsRefactored from './SystemSettingsRefactored'
import SecurityManagement from './SecurityManagement'
import ContentManagementConnected from './ContentManagementConnected'
import SystemHealthConnected from './SystemHealthConnected'
import StorageManagement from './StorageManagement'
import EmailManagement from './EmailManagement'
import { useAnalyticsOverview, useSystemMetrics } from '@/hooks/use-api'

interface AdminDashboardConnectedProps {
  lng: string
}

const tabs = [
  { id: 'overview', name: 'Overview', icon: ChartBarIcon },
  { id: 'users', name: 'User Management', icon: UsersIcon },
  { id: 'content', name: 'Content', icon: FolderIcon },
  { id: 'storage', name: 'Storage', icon: CloudArrowUpIcon },
  { id: 'email', name: 'Email', icon: EnvelopeIcon },
  { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  { id: 'settings', name: 'Settings', icon: CogIcon },
  { id: 'health', name: 'System Health', icon: ServerIcon }
]

export default function AdminDashboardConnected({ lng }: AdminDashboardConnectedProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview')
  
  const { data: analytics, loading: analyticsLoading } = useAnalyticsOverview()
  const { data: systemMetrics, loading: systemLoading } = useSystemMetrics()

  useEffect(() => {
    const newTab = searchParams.get('tab') || 'overview'
    setActiveTab(newTab)
  }, [searchParams])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    router.push(`/${lng}/admin?tab=${tabId}`)
  }

  const overviewStats = [
    {
      name: 'Total Users',
      value: systemMetrics?.userCount?.toLocaleString() || '0',
      change: analytics?.growth?.users?.percentChange ? `${analytics.growth.users.percentChange > 0 ? '+' : ''}${analytics.growth.users.percentChange}%` : '+0%',
      changeType: analytics?.growth?.users?.percentChange > 0 ? 'positive' : 'neutral',
      icon: UsersIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Total Assets',
      value: analytics?.metrics?.totalAssets?.toLocaleString() || '0',
      change: analytics?.growth?.uploads?.percentChange ? `${analytics.growth.uploads.percentChange > 0 ? '+' : ''}${analytics.growth.uploads.percentChange}%` : '+0%',
      changeType: analytics?.growth?.uploads?.percentChange > 0 ? 'positive' : 'neutral',
      icon: FolderIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Storage Used',
      value: `${analytics?.metrics?.storageUsedGB || '0'} GB`,
      change: '+0%',
      changeType: 'neutral',
      icon: CloudArrowUpIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Active Sessions',
      value: systemMetrics?.activeSessions?.toString() || '0',
      change: '+0%',
      changeType: 'neutral',
      icon: ShieldCheckIcon,
      color: 'from-yellow-500 to-yellow-600'
    }
  ]

  const recentAlerts = systemMetrics?.recentErrors?.slice(0, 3).map((error: any, index: number) => ({
    id: index,
    type: error.statusCode >= 500 ? 'error' : 'warning',
    message: error.message || `${error.method} ${error.url} - ${error.statusCode}`,
    time: new Date(error.timestamp).toLocaleTimeString()
  })) || []

  const systemStatus = {
    database: systemMetrics?.health?.database || 'unknown',
    storage: systemMetrics?.health?.storage || 'unknown',
    server: systemMetrics?.health?.server || 'healthy',
    cdn: systemMetrics?.health?.cdn || 'unknown'
  }

  if (analyticsLoading || systemLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage users, content, and system settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat) => (
              <div key={stat.name} className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6">
                <dt>
                  <div className={`absolute rounded-md bg-gradient-to-r ${stat.color} p-3`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </p>
                </dd>
              </div>
            ))}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Alerts</h2>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            {recentAlerts.length > 0 ? (
              <div className="space-y-3">
                {recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className={`h-5 w-5 ${
                      alert.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent alerts</p>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Status</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="text-center">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    status === 'healthy' ? 'bg-green-100 dark:bg-green-900' :
                    status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    status === 'error' ? 'bg-red-100 dark:bg-red-900' :
                    'bg-gray-100 dark:bg-gray-900'
                  }`}>
                    <div className={`h-3 w-3 rounded-full ${
                      status === 'healthy' ? 'bg-green-600' :
                      status === 'warning' ? 'bg-yellow-600' :
                      status === 'error' ? 'bg-red-600' :
                      'bg-gray-600'
                    }`} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white capitalize">{service}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && <UserManagementConnected lng={lng} />}
      {activeTab === 'content' && <ContentManagementConnected lng={lng} />}
      {activeTab === 'storage' && <StorageManagement lng={lng} />}
      {activeTab === 'email' && <EmailManagement lng={lng} />}
      {activeTab === 'security' && <SecurityManagement lng={lng} />}
      {activeTab === 'settings' && <SystemSettingsRefactored lng={lng} />}
      {activeTab === 'health' && <SystemHealthConnected lng={lng} />}
    </div>
  )
}