'use client'

import { useState } from 'react'
import {
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FolderIcon,
  CloudArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import {
  useAnalyticsOverview,
  useAnalyticsTrends,
  useTopContent,
  useFileTypes
} from '@/hooks/use-api'

interface AnalyticsContentConnectedProps {
  lng: string
  translations: {
    title: string
    overview: string
    trends: string
    topContent: string
    fileTypes: string
    period: {
      '7d': string
      '30d': string
      '90d': string
      '1y': string
    }
    metrics: {
      uploads: string
      downloads: string
      views: string
      shares: string
      storage: string
      users: string
    }
    loading: string
    error: string
    noData: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AnalyticsContentConnected({ lng, translations }: AnalyticsContentConnectedProps) {
  const [selectedMetric, setSelectedMetric] = useState<'uploads' | 'downloads' | 'views' | 'shares'>('views')
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [topContentMetric, setTopContentMetric] = useState<'views' | 'downloads' | 'shares'>('views')

  // Fetch data
  const { data: overview, loading: overviewLoading } = useAnalyticsOverview()
  const { data: trends, loading: trendsLoading } = useAnalyticsTrends(selectedMetric, selectedPeriod)
  const { data: topContent, loading: topContentLoading } = useTopContent(topContentMetric, 10, selectedPeriod)
  const { data: fileTypes, loading: fileTypesLoading } = useFileTypes()

  const metrics = overview?.metrics
  const growth = overview?.growth

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <ChartBarIcon className="h-8 w-8 mr-3" />
            {translations.title}
          </h1>
        </div>

        {/* Overview Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {translations.overview}
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              title={translations.metrics.uploads}
              value={metrics?.totalAssets?.toLocaleString() || '0'}
              change={growth?.uploads?.percentChange}
              icon={CloudArrowDownIcon}
              color="blue"
            />
            <OverviewCard
              title={translations.metrics.downloads}
              value={metrics?.totalDownloads?.toLocaleString() || '0'}
              icon={CloudArrowDownIcon}
              color="green"
            />
            <OverviewCard
              title={translations.metrics.views}
              value={metrics?.totalViews?.toLocaleString() || '0'}
              icon={EyeIcon}
              color="purple"
            />
            <OverviewCard
              title={translations.metrics.storage}
              value={`${metrics?.storageUsedGB || '0'} GB`}
              icon={FolderIcon}
              color="yellow"
            />
          </div>
        </div>

        {/* Trends Chart */}
        <div className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {translations.trends}
            </h2>
            <div className="flex gap-2">
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                {Object.entries(translations.metrics).slice(0, 4).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                {Object.entries(translations.period).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {trendsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <TrendsChart data={trends?.data || []} metric={selectedMetric} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Top Content */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {translations.topContent}
              </h2>
              <select
                value={topContentMetric}
                onChange={(e) => setTopContentMetric(e.target.value as any)}
                className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
              >
                <option value="views">{translations.metrics.views}</option>
                <option value="downloads">{translations.metrics.downloads}</option>
                <option value="shares">{translations.metrics.shares}</option>
              </select>
            </div>

            {topContentLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <TopContentList items={topContent?.topContent || []} metric={topContentMetric} />
            )}
          </div>

        </div>

        {/* File Types */}
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {translations.fileTypes}
          </h2>

          {fileTypesLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <FileTypeDistribution distribution={fileTypes?.distribution || []} />
          )}
        </div>
      </div>
    </div>
  )
}

// Sub-components

function OverviewCard({ title, value, change, icon: Icon, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {value}
                </div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? (
                      <ArrowUpIcon className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="ml-1">{Math.abs(change)}%</span>
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TrendsChart({ data, metric }: any) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d: any) => d.value))

  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-full">
        {data.map((point: any, index: number) => (
          <div
            key={index}
            className="flex-1 mx-0.5 flex flex-col items-center justify-end"
            title={`${point.date}: ${point.value}`}
          >
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {point.value}
            </span>
            <div
              className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
              style={{
                height: `${(point.value / maxValue) * 80}%`,
                minHeight: '4px'
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TopContentList({ items, metric }: any) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item: any, index: number) => (
        <div key={item.asset.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-gray-500 dark:text-gray-400 text-sm w-6">
              {index + 1}.
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {item.asset.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.asset.type}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {item.count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.percentage}%
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FileTypeDistribution({ distribution }: any) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No file type data available
      </div>
    )
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500'
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {distribution.map((type: any, index: number) => (
        <div key={type.type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {type.typeLabel}
            </h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${colors[index % colors.length]}`}>
              {type.percentages.count}%
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Files:</span>
              <span className="text-gray-900 dark:text-white">{type.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Size:</span>
              <span className="text-gray-900 dark:text-white">{type.totalSizeGB} GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Avg:</span>
              <span className="text-gray-900 dark:text-white">{type.avgSizeMB} MB</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}