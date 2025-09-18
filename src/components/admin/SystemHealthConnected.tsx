'use client'

import { useEffect } from 'react'
import { 
  ServerIcon,
  CircleStackIcon,
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { useSystemHealth, useSystemMetrics, useSystemErrors } from '@/hooks/use-api'

interface SystemHealthConnectedProps {
  lng: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SystemHealthConnected({ lng }: SystemHealthConnectedProps) {
  const { data: health, loading: healthLoading } = useSystemHealth()
  const { data: metrics, loading: metricsLoading } = useSystemMetrics()
  // const { data: jobs, loading: jobsLoading } = useSystemJobs()
  const { data: errors, loading: errorsLoading } = useSystemErrors()
  
  useEffect(() => {
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      // Refetch data
    }, 30000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
      case 'unhealthy':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return CheckCircleIcon
      case 'degraded':
        return ExclamationTriangleIcon
      case 'unhealthy':
        return XCircleIcon
      default:
        return ClockIcon
    }
  }

  if (healthLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const services = [
    {
      name: 'Database',
      status: health?.checks?.database?.status || 'unknown',
      icon: CircleStackIcon,
      details: health?.checks?.database || {}
    },
    {
      name: 'Storage (S3)',
      status: health?.checks?.storage?.status || 'unknown',
      icon: CloudIcon,
      details: health?.checks?.storage || {}
    },
    {
      name: 'Redis Cache',
      status: health?.checks?.redis?.status || 'unknown',
      icon: ServerIcon,
      details: health?.checks?.redis || {}
    },
    {
      name: 'CDN',
      status: health?.checks?.cdn?.status || 'unknown',
      icon: CpuChipIcon,
      details: health?.checks?.cdn || {}
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Status</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            health?.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : health?.status === 'degraded' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {health?.status === 'healthy' ? 'All Systems Operational' : 
             health?.status === 'degraded' ? 'Partial Degradation' : 'System Issues Detected'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => {
            const StatusIcon = getStatusIcon(service.status)
            return (
              <div key={service.name} className="border border-white/20 rounded-xl p-4 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <service.icon className="h-5 w-5 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{service.name}</h3>
                  </div>
                  <StatusIcon className={`h-5 w-5 ${
                    service.status === 'healthy' ? 'text-green-600' : 
                    service.status === 'degraded' ? 'text-yellow-600' : 
                    service.status === 'unhealthy' ? 'text-red-600' : 
                    'text-gray-600'
                  }`} />
                </div>
                <p className={`text-xs font-medium ${getStatusColor(service.status)} inline-flex px-2 py-1 rounded-full`}>
                  {service.status.toUpperCase()}
                </p>
                {service.details.message && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {service.details.message}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics?.metrics?.database?.latencyMs || metrics?.metrics?.database?.queryLatency || 0}ms
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (metrics?.metrics?.database?.latencyMs || 0) < 200 ? 'bg-green-600' :
                    (metrics?.metrics?.database?.latencyMs || 0) < 500 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, ((metrics?.metrics?.database?.latencyMs || 0) / 1000) * 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Process Memory (Heap)</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics?.metrics?.server?.memory?.heapUsedMB || 0}MB / {metrics?.metrics?.server?.memory?.heapTotalMB || 0}MB
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics?.metrics?.server?.memory?.percentUsed || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                RSS: {metrics?.metrics?.server?.memory?.rssMB || 0}MB | System: {metrics?.metrics?.server?.memory?.systemFreeGB || 0}GB free of {metrics?.metrics?.server?.memory?.systemTotalGB || 0}GB
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {metrics?.metrics?.activity?.activeUsers || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Request Rate</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {metrics?.metrics?.activity?.requestsPerMinute || 0}/min
                </p>
              </div>
            </div>
            
            {metrics?.metrics?.server?.cpu?.loadAverage && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">CPU Load Average</p>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    1m: <span className="font-medium text-gray-900 dark:text-white">{metrics.metrics.server.cpu.loadAverage['1min']}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    5m: <span className="font-medium text-gray-900 dark:text-white">{metrics.metrics.server.cpu.loadAverage['5min']}</span>
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    15m: <span className="font-medium text-gray-900 dark:text-white">{metrics.metrics.server.cpu.loadAverage['15min']}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Cores: {metrics.metrics.server.cpu.cores}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Job Queue Status */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Statistics</h3>
          <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics?.metrics?.activity?.activeUsers || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Assets</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {metrics?.metrics?.storage?.assetCount || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Storage Used</span>
                <span className="text-sm font-medium text-green-600">
                  {metrics?.metrics?.storage?.totalUsedGB || 0} GB
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className="text-sm font-medium text-red-600">
                  {(metrics?.metrics?.activity?.errorRatePercent || 0)}%
                </span>
              </div>
              {metrics?.metrics?.server?.uptime && (
                <div className="flex items-center justify-between py-2 border-t border-white/20">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Server Uptime</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics.metrics.server.uptime.formatted || 'N/A'}
                  </span>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Errors</h3>
        {errorsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : errors?.recentErrors?.activities && errors.recentErrors.activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Message
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {errors.recentErrors.activities.slice(0, 10).map((error: any, index: number) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2 text-sm whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`}>
                        {error.type || 'ERROR'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate">
                        {error.error?.message || error.error?.error || JSON.stringify(error.error) || 'Unknown error'}
                      </div>
                      {error.user && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          User: {error.user.firstName || error.user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {error.count || 1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No recent errors</p>
        )}
      </div>
    </div>
  )
}