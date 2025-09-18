'use client'

import { useState, useEffect } from 'react'
import { 
  EyeIcon, 
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts'
import { format, subDays } from 'date-fns'

// Sample data generators for realistic analytics
const generateDailyData = (days: number) => {
  const data = []
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(new Date(), i)
    data.push({
      date: format(date, 'MMM dd'),
      fullDate: date,
      views: Math.floor(Math.random() * 1000) + 500,
      downloads: Math.floor(Math.random() * 200) + 50,
      uploads: Math.floor(Math.random() * 50) + 10,
      users: Math.floor(Math.random() * 100) + 25,
    })
  }
  return data
}

const generateMonthlyData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months.map(month => ({
    month,
    views: Math.floor(Math.random() * 20000) + 10000,
    downloads: Math.floor(Math.random() * 5000) + 2000,
    uploads: Math.floor(Math.random() * 1000) + 500,
    users: Math.floor(Math.random() * 2000) + 1000,
  }))
}

const fileTypeData = [
  { name: 'Images', value: 45, color: '#8B5CF6' },
  { name: 'Videos', value: 25, color: '#06B6D4' },
  { name: 'Documents', value: 20, color: '#10B981' },
  { name: 'Audio', value: 10, color: '#F59E0B' }
]

const topContentData = [
  { name: 'Brand Guidelines.pdf', views: 2450, downloads: 892, trend: 'up' },
  { name: 'Product Demo Video.mp4', views: 1980, downloads: 654, trend: 'up' },
  { name: 'Logo Collection.zip', views: 1756, downloads: 1234, trend: 'down' },
  { name: 'Marketing Assets.zip', views: 1543, downloads: 432, trend: 'up' },
  { name: 'Q4 Presentation.pptx', views: 1234, downloads: 567, trend: 'up' }
]

const userActivityData = [
  { name: 'Active', value: 75, color: '#10B981' },
  { name: 'Inactive', value: 20, color: '#6B7280' },
  { name: 'New', value: 5, color: '#8B5CF6' }
]

const departmentUsageData = [
  { department: 'Marketing', usage: 85 },
  { department: 'Design', usage: 72 },
  { department: 'Sales', usage: 68 },
  { department: 'Engineering', usage: 45 },
  { department: 'HR', usage: 32 },
  { department: 'Finance', usage: 28 }
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AnalyticsContent({ lng }: { lng: string }) {
  const [timeRange, setTimeRange] = useState('7d')
  const [dailyData, setDailyData] = useState(generateDailyData(7))
  const [monthlyData] = useState(generateMonthlyData())
  const [activeMetric, setActiveMetric] = useState('views')

  // Update data when time range changes
  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    setDailyData(generateDailyData(days))
  }, [timeRange])

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyData(prevData => 
        prevData.map(item => ({
          ...item,
          views: item.views + Math.floor(Math.random() * 10),
          downloads: item.downloads + Math.floor(Math.random() * 3),
        }))
      )
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const totalViews = dailyData.reduce((sum, item) => sum + item.views, 0)
  const totalDownloads = dailyData.reduce((sum, item) => sum + item.downloads, 0)
  const totalUploads = dailyData.reduce((sum, item) => sum + item.uploads, 0)
  const totalUsers = dailyData.reduce((sum, item) => sum + item.users, 0)

  const kpiCards = [
    {
      title: 'Total Views',
      value: totalViews.toLocaleString(),
      change: '+12.5%',
      trend: 'up',
      icon: EyeIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Downloads',
      value: totalDownloads.toLocaleString(),
      change: '+8.2%',
      trend: 'up',
      icon: ArrowDownTrayIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Uploads',
      value: totalUploads.toLocaleString(),
      change: '+15.3%',
      trend: 'up',
      icon: FolderIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Active Users',
      value: Math.floor(totalUsers / dailyData.length).toLocaleString(),
      change: '-2.1%',
      trend: 'down',
      icon: UsersIcon,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  interface TooltipPayloadItem {
    name: string
    value: number
    color: string
  }

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean
    payload?: TooltipPayloadItem[]
    label?: string 
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-4">Analytics Dashboard</h1>
          <p className="text-white/70 text-lg">Track your content performance and user engagement</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1 border border-white/20">
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiCards.map((card) => (
          <div key={card.title} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              {card.trend === 'up' ? (
                <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />
              ) : (
                <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-white/70 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-white mb-2">{card.value}</p>
              <span className={`text-sm font-medium ${
                card.trend === 'up' ? 'text-green-400' : 'text-red-400'
              }`}>
                {card.change} from last period
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Traffic Overview */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Traffic Overview</h3>
            <div className="flex gap-2">
              {['views', 'downloads', 'uploads'].map((metric) => (
                <button
                  key={metric}
                  onClick={() => setActiveMetric(metric)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeMetric === metric
                      ? 'bg-purple-600 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke="#8B5CF6"
                fill="url(#colorGradient)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* File Types Distribution */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Content Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fileTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {fileTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: 'white' }}
                formatter={(value) => <span style={{ color: 'white' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Trends */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
              <YAxis stroke="rgba(255,255,255,0.7)" />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ color: 'white' }}
                formatter={(value) => <span style={{ color: 'white' }}>{value}</span>}
              />
              <Line type="monotone" dataKey="views" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="downloads" stroke="#06B6D4" strokeWidth={2} />
              <Line type="monotone" dataKey="uploads" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Department Usage */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Department Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentUsageData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
              <YAxis dataKey="department" type="category" stroke="rgba(255,255,255,0.7)" width={80} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="usage" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Content */}
        <div className="lg:col-span-2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">Top Performing Content</h3>
          <div className="space-y-4">
            {topContentData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{item.name}</div>
                    <div className="text-white/60 text-sm">
                      {item.views.toLocaleString()} views • {item.downloads.toLocaleString()} downloads
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-white mb-6">User Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={userActivityData}>
              <RadialBar
                label={{ position: 'insideStart', fill: '#fff' }}
                background
                dataKey="value"
              />
              <Legend 
                iconSize={10}
                layout="vertical"
                verticalAlign="bottom"
                wrapperStyle={{ color: 'white', fontSize: '12px' }}
                formatter={(value) => <span style={{ color: 'white' }}>{value}</span>}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-3">
            {userActivityData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-white/80 text-sm">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}