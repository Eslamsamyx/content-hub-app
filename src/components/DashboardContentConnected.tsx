'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  FolderIcon,
  UsersIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhotoIcon,
  CubeIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { 
  useAnalyticsOverview, 
  useAnalyticsTrends, 
  useTopContent,
  useProfile 
} from '@/hooks/use-api'

interface DashboardContentConnectedProps {
  lng: string
  translations: {
    welcome: string
    overview: string
    quickActions: string
    uploadAssets: string
    viewLibrary: string
    manageCollections: string
    viewAnalytics: string
    recentActivity: string
    viewAll: string
    stats: {
      totalAssets: string
      totalDownloads: string
      totalViews: string
      activeUsers: string
      storageUsed: string
      recentUploads: string
    }
    trends: {
      uploads: string
      downloads: string
      views: string
      period: string
    }
    topContent: string
    assetTypes: string
    loading: string
    error: string
  }
}

export default function DashboardContentConnected({ lng, translations }: DashboardContentConnectedProps) {
  const [selectedMetric, setSelectedMetric] = useState<'uploads' | 'downloads' | 'views'>('uploads')
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  // Fetch data
  const { data: profile } = useProfile()
  const { data: overview, loading: overviewLoading } = useAnalyticsOverview()
  const { data: trends, loading: trendsLoading } = useAnalyticsTrends(selectedMetric, selectedPeriod)
  const { data: topContent, loading: topContentLoading } = useTopContent('views', 5, '7d')

  const metrics = overview?.metrics
  const growth = overview?.growth

  const quickActions = [
    {
      name: translations.uploadAssets,
      href: `/${lng}/upload`,
      icon: CloudArrowUpIcon,
      color: 'bg-blue-500',
    },
    {
      name: translations.viewLibrary,
      href: `/${lng}/library`,
      icon: FolderIcon,
      color: 'bg-green-500',
    },
    {
      name: translations.manageCollections,
      href: `/${lng}/collections`,
      icon: FolderIcon,
      color: 'bg-purple-500',
    },
    {
      name: translations.viewAnalytics,
      href: `/${lng}/analytics`,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
    },
  ]

  const statCards = [
    {
      name: translations.stats.totalAssets,
      value: metrics?.totalAssets?.toLocaleString() || '0',
      icon: FolderIcon,
      change: growth?.uploads?.percentChange ? `${growth.uploads.percentChange}%` : null,
      trend: growth?.uploads?.percentChange > 0 ? 'up' : 'down',
      color: 'bg-blue-500',
    },
    {
      name: translations.stats.totalDownloads,
      value: metrics?.totalDownloads?.toLocaleString() || '0',
      icon: CloudArrowUpIcon,
      change: null,
      color: 'bg-green-500',
    },
    {
      name: translations.stats.totalViews,
      value: metrics?.totalViews?.toLocaleString() || '0',
      icon: DocumentTextIcon,
      change: null,
      color: 'bg-purple-500',
    },
    {
      name: translations.stats.activeUsers,
      value: metrics?.activeUsers?.toString() || '0',
      icon: UsersIcon,
      change: null,
      color: 'bg-yellow-500',
    },
    {
      name: translations.stats.storageUsed,
      value: `${metrics?.storageUsedGB || '0'} GB`,
      icon: FolderIcon,
      change: null,
      color: 'bg-indigo-500',
    },
    {
      name: translations.stats.recentUploads,
      value: metrics?.recentUploads?.toString() || '0',
      icon: ClockIcon,
      subtitle: 'Last 7 days',
      change: null,
      color: 'bg-pink-500',
    },
  ]

  const assetTypeIcons: Record<string, any> = {
    IMAGE: PhotoIcon,
    VIDEO: VideoCameraIcon,
    DOCUMENT: DocumentTextIcon,
    AUDIO: MusicalNoteIcon,
    MODEL_3D: CubeIcon,
    DESIGN: PaintBrushIcon,
  }

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{translations.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {translations.welcome}, {profile?.firstName || profile?.name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {translations.overview}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {translations.quickActions}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <span className={`inline-flex rounded-lg p-3 ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat) => (
              <div
                key={stat.name}
                className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
              >
                <dt>
                  <div className={`absolute rounded-md p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
                  {stat.subtitle && (
                    <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">{stat.subtitle}</p>
                  )}
                  {stat.change && (
                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 flex-shrink-0 self-center" />
                      )}
                      <span className="ml-1">{stat.change}</span>
                    </p>
                  )}
                </dd>
              </div>
            ))}
          </div>
        </div>

        {/* Charts and Top Content */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Trends Chart */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {translations.trends[selectedMetric]}
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value as any)}
                  className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                >
                  <option value="uploads">{translations.trends.uploads}</option>
                  <option value="downloads">{translations.trends.downloads}</option>
                  <option value="views">{translations.trends.views}</option>
                </select>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                >
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                </select>
              </div>
            </div>
            {trendsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-64">
                {/* Simple chart visualization */}
                <div className="flex items-end justify-between h-full">
                  {trends?.data?.map((point: any, index: number) => (
                    <div
                      key={index}
                      className="flex-1 mx-1"
                      title={`${point.date}: ${point.value}`}
                    >
                      <div
                        className="bg-blue-500 rounded-t"
                        style={{
                          height: `${(point.value / Math.max(...(trends.data || []).map((p: any) => p.value))) * 100}%`,
                          minHeight: '4px'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
                  Total: {trends?.summary?.total || 0} | Average: {trends?.summary?.average || 0}
                </div>
              </div>
            )}
          </div>

          {/* Top Content */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {translations.topContent}
            </h3>
            {topContentLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {topContent?.topContent?.map((item: any, index: number) => {
                  const Icon = assetTypeIcons[item.asset.type] || FolderIcon
                  return (
                    <div key={item.asset.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-500 dark:text-gray-400 text-sm w-4">
                          {index + 1}.
                        </span>
                        <Icon className="h-5 w-5 text-gray-400" />
                        <Link
                          href={`/${lng}/library/asset/${item.asset.id}`}
                          className="text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-xs"
                        >
                          {item.asset.title}
                        </Link>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {item.count} views
                      </span>
                    </div>
                  )
                })}
                {(!topContent?.topContent || topContent.topContent.length === 0) && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No content data available yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}