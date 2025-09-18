'use client'

import { useState, useEffect } from 'react'
import { 
  ServerIcon, 
  CpuChipIcon, 
  CircleStackIcon, 
  CloudArrowUpIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface SystemMetric {
  name: string
  value: number
  status: 'healthy' | 'warning' | 'critical'
  unit: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'maintenance'
  uptime: string
  lastCheck: string
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      name: 'CPU Usage',
      value: 45,
      status: 'healthy',
      unit: '%',
      icon: CpuChipIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Memory Usage',
      value: 68,
      status: 'warning',
      unit: '%',
      icon: ServerIcon,
      color: 'from-orange-500 to-orange-600'
    },
    {
      name: 'Disk Usage',
      value: 82,
      status: 'critical',
      unit: '%',
      icon: CircleStackIcon,
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'Network I/O',
      value: 234,
      status: 'healthy',
      unit: 'MB/s',
      icon: SignalIcon,
      color: 'from-green-500 to-green-600'
    }
  ])

  const [services] = useState<ServiceStatus[]>([
    {
      name: 'Web Server',
      status: 'online',
      uptime: '99.9%',
      lastCheck: '30 seconds ago'
    },
    {
      name: 'Database',
      status: 'online',
      uptime: '99.8%',
      lastCheck: '30 seconds ago'
    },
    {
      name: 'File Storage',
      status: 'online',
      uptime: '99.9%',
      lastCheck: '30 seconds ago'
    },
    {
      name: 'Search Engine',
      status: 'maintenance',
      uptime: '98.5%',
      lastCheck: '2 minutes ago'
    },
    {
      name: 'Backup Service',
      status: 'online',
      uptime: '99.2%',
      lastCheck: '1 minute ago'
    },
    {
      name: 'Email Service',
      status: 'offline',
      uptime: '97.8%',
      lastCheck: '5 minutes ago'
    }
  ])

  const [systemLogs] = useState([
    {
      id: 1,
      timestamp: '2024-01-26 14:23:15',
      level: 'INFO',
      service: 'Web Server',
      message: 'Successfully processed 1,234 requests in the last minute'
    },
    {
      id: 2,
      timestamp: '2024-01-26 14:22:45',
      level: 'WARNING',
      service: 'Database',
      message: 'Connection pool usage is at 75%'
    },
    {
      id: 3,
      timestamp: '2024-01-26 14:21:30',
      level: 'ERROR',
      service: 'Email Service',
      message: 'Failed to connect to SMTP server'
    },
    {
      id: 4,
      timestamp: '2024-01-26 14:20:00',
      level: 'INFO',
      service: 'File Storage',
      message: 'Backup completed successfully'
    },
    {
      id: 5,
      timestamp: '2024-01-26 14:19:15',
      level: 'WARNING',
      service: 'Search Engine',
      message: 'Index rebuild started - service temporarily unavailable'
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10))
        }))
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-400'
      case 'warning':
      case 'maintenance':
        return 'text-yellow-400'
      case 'critical':
      case 'offline':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircleIcon className="w-5 h-5 text-white/70" />
      case 'maintenance':
        return <ExclamationTriangleIcon className="w-5 h-5 text-white/70" />
      case 'offline':
        return <ExclamationTriangleIcon className="w-5 h-5 text-white/70" />
      default:
        return <CheckCircleIcon className="w-5 h-5 text-white/70" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'text-blue-400 bg-blue-500/10'
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10'
      case 'ERROR':
        return 'text-red-400 bg-red-500/10'
      default:
        return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-8">
      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.name} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-white/10">
                <metric.icon className="w-6 h-6 text-white/70" />
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                {metric.value.toFixed(1)}{metric.unit}
              </div>
            </div>
            <div className="mb-3">
              <h3 className="text-white font-medium">{metric.name}</h3>
              <p className={`text-sm ${getStatusColor(metric.status)} capitalize`}>
                {metric.status}
              </p>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  metric.status === 'healthy' ? 'bg-green-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, metric.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Service Status */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <ServerIcon className="w-6 h-6 text-white/70" />
            Service Status
          </h3>
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="text-white font-medium">{service.name}</div>
                    <div className="text-white/60 text-sm">Uptime: {service.uptime}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium capitalize ${getStatusColor(service.status)}`}>
                    {service.status}
                  </div>
                  <div className="text-white/60 text-xs">{service.lastCheck}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Logs */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Recent System Logs</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {systemLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-white/60 text-xs">{log.timestamp}</span>
                </div>
                <div className="text-white/80 text-sm mb-1">{log.service}</div>
                <div className="text-white text-sm">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Overview */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <CloudArrowUpIcon className="w-6 h-6" />
          Storage Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">2.4 TB</div>
            <div className="text-white/70">Total Used</div>
            <div className="w-full bg-white/10 rounded-full h-3 mt-3">
              <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">800 GB</div>
            <div className="text-white/70">Available</div>
            <div className="w-full bg-white/10 rounded-full h-3 mt-3">
              <div className="h-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-full" style={{ width: '25%' }} />
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">18,432</div>
            <div className="text-white/70">Total Files</div>
            <div className="text-white/60 text-sm mt-3">
              Avg size: 130 MB
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <div className="text-2xl font-bold text-green-400 mb-1">1.2s</div>
            <div className="text-white/70 text-sm">Avg Response Time</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <div className="text-2xl font-bold text-blue-400 mb-1">234</div>
            <div className="text-white/70 text-sm">Requests/min</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <div className="text-2xl font-bold text-purple-400 mb-1">99.9%</div>
            <div className="text-white/70 text-sm">Uptime</div>
          </div>
          <div className="text-center p-4 bg-white/5 rounded-xl">
            <div className="text-2xl font-bold text-orange-400 mb-1">12</div>
            <div className="text-white/70 text-sm">Active Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )
}