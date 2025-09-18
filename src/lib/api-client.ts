/**
 * API Client for making requests to backend endpoints
 */

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || ''
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // Important for cookies/sessions
      })

      const data = await response.json()

      if (!response.ok) {
        throw data
      }

      return data
    } catch (error: any) {
      if (error.error) {
        // API error response
        throw error
      }
      // Network or other error
      throw {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
          details: error
        }
      }
    }
  }

  // Assets
  async getAssets(params?: {
    page?: number
    limit?: number
    type?: string
    category?: string
    tags?: string[]
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v))
          } else {
            queryParams.set(key, String(value))
          }
        }
      })
    }
    
    return this.request(`/api/assets?${queryParams}`)
  }

  async getAsset(id: string) {
    return this.request(`/api/assets/${id}`)
  }

  async uploadAsset(data: {
    fileName: string
    fileSize: number
    fileType?: string
  }) {
    return this.request('/api/assets/upload/prepare', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async completeUpload(data: {
    uploadId: string
    fileKey: string
    metadata: {
      title: string
      description?: string
      category: string
      tags?: string[]
      eventName?: string
      company?: string
      project?: string
      campaign?: string
      productionYear?: number
      usage?: 'internal' | 'public'
      readyForPublishing?: boolean
    }
    fileSize: number
    mimeType: string
    originalFilename: string
    width?: number
    height?: number
    duration?: number
  }) {
    return this.request('/api/assets/upload/complete', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async trackAssetView(id: string) {
    return this.request(`/api/assets/${id}/view`, {
      method: 'POST'
    })
  }

  async downloadAsset(id: string) {
    return this.request(`/api/assets/${id}/download`)
  }

  async deleteAsset(id: string) {
    return this.request(`/api/assets/${id}`, {
      method: 'DELETE'
    })
  }

  // Search
  async search(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value))
      })
    }
    return this.request(`/api/search?${params}`)
  }

  async getSearchSuggestions(query: string) {
    return this.request(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
  }

  async advancedSearch(data: any) {
    return this.request('/api/search/advanced', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Collections
  async getCollections(params?: {
    page?: number
    limit?: number
    search?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/collections?${queryParams}`)
  }

  async getCollection(id: string) {
    return this.request(`/api/collections/${id}`)
  }

  async createCollection(data: {
    name: string
    description?: string
    isPublic?: boolean
  }) {
    console.log('ApiClient.createCollection called with:', data)
    const result = await this.request('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    console.log('ApiClient.createCollection result:', result)
    return result
  }

  async updateCollection(id: string, data: any) {
    return this.request(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async getCollectionAssets(collectionId: string, params?: {
    page?: number
    limit?: number
    search?: string
    type?: string
    sortBy?: string
    sortOrder?: string
  }) {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.append('page', params.page.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.type) searchParams.append('type', params.type)
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy)
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)
    
    const queryString = searchParams.toString()
    return this.request(`/api/collections/${collectionId}/assets${queryString ? `?${queryString}` : ''}`)
  }

  async addToCollection(collectionId: string, assetIds: string[]) {
    return this.request(`/api/collections/${collectionId}/assets`, {
      method: 'POST',
      body: JSON.stringify({ assetIds })
    })
  }

  async removeFromCollection(collectionId: string, assetId: string) {
    return this.request(`/api/collections/${collectionId}/assets/${assetId}`, {
      method: 'DELETE'
    })
  }

  async deleteCollection(id: string) {
    return this.request(`/api/collections/${id}`, {
      method: 'DELETE'
    })
  }

  async pinCollection(id: string) {
    return this.request(`/api/collections/${id}/pin`, {
      method: 'POST'
    })
  }

  // Tags
  async getTags(category?: string) {
    const params = category ? `?category=${category}` : ''
    return this.request(`/api/tags${params}`)
  }

  async getTagSuggestions(query: string) {
    return this.request(`/api/tags/suggestions?q=${encodeURIComponent(query)}`)
  }

  // Analytics
  async getAnalyticsOverview() {
    return this.request('/api/analytics/overview')
  }

  async getAnalyticsTrends(metric: string, period: string = '30d') {
    return this.request(`/api/analytics/trends?metric=${metric}&period=${period}`)
  }

  async getTopContent(metric: string, limit: number = 10, period?: string) {
    const params = new URLSearchParams({ metric, limit: String(limit) })
    if (period) params.set('period', period)
    return this.request(`/api/analytics/top-content?${params}`)
  }


  async getFileTypes() {
    return this.request('/api/analytics/file-types')
  }

  async getAssetAnalytics(id: string, period?: string) {
    const params = period ? `?period=${period}` : ''
    return this.request(`/api/assets/${id}/analytics${params}`)
  }

  // Users
  async getUsers(params?: {
    page?: number
    limit?: number
    role?: string
    department?: string
    search?: string
    status?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/users?${queryParams}`)
  }

  async getUser(id: string) {
    return this.request(`/api/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.request(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async toggleUserStatus(id: string, isActive: boolean) {
    return this.request(`/api/users/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ isActive })
    })
  }

  // Profile
  async getProfile() {
    return this.request('/api/profile')
  }

  async updateProfile(data: any) {
    return this.request('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async getProfileUploads(params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/profile/uploads?${queryParams}`)
  }

  async getProfileActivity(params?: { limit?: number }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/profile/activity?${queryParams}`)
  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('avatar', file)
    return this.request('/api/profile/avatar', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    })
  }

  async deleteAvatar() {
    return this.request('/api/profile/avatar', {
      method: 'DELETE'
    })
  }

  async deleteUser(id: string) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE'
    })
  }

  // Reviews
  async submitForReview(assetId: string) {
    return this.request(`/api/assets/${assetId}/submit-review`, {
      method: 'POST'
    })
  }

  async getPendingReviews(params?: {
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/reviews/pending?${queryParams}`)
  }

  async getReview(id: string) {
    return this.request(`/api/reviews/${id}`)
  }

  async approveReview(id: string, comments?: string) {
    return this.request(`/api/reviews/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments })
    })
  }

  async rejectReview(id: string, comments: string, reasons: string[]) {
    return this.request(`/api/reviews/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments, reasons })
    })
  }

  async requestChanges(id: string, comments: string, requiredChanges: string[]) {
    return this.request(`/api/reviews/${id}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ comments, requiredChanges })
    })
  }

  // Notifications
  async getNotifications(params?: {
    isRead?: boolean
    type?: string
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/notifications?${queryParams}`)
  }

  async markNotificationRead(id: string) {
    return this.request(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    })
  }

  async markAllNotificationsRead() {
    return this.request('/api/notifications/mark-all-read', {
      method: 'POST'
    })
  }

  async deleteNotification(id: string) {
    return this.request(`/api/notifications/${id}`, {
      method: 'DELETE'
    })
  }

  async getNotificationPreferences() {
    return this.request('/api/notifications/preferences')
  }

  async updateNotificationPreferences(data: any) {
    return this.request('/api/notifications/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  // Activity
  async getActivity(params?: {
    type?: string
    userId?: string
    assetId?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    limit?: number
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/activity?${queryParams}`)
  }

  async exportActivity(params?: {
    format?: 'json' | 'csv'
    type?: string
    userId?: string
    assetId?: string
    dateFrom?: string
    dateTo?: string
  }) {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.set(key, String(value))
      })
    }
    return this.request(`/api/activity/export?${queryParams}`)
  }

  // System
  async getSystemHealth() {
    return this.request('/api/system/health')
  }

  async getSystemMetrics() {
    return this.request('/api/system/metrics')
  }

  async getJobQueueStatus() {
    return this.request('/api/system/jobs')
  }

  async getSystemErrors(hours: number = 24, limit: number = 50) {
    return this.request(`/api/system/errors?hours=${hours}&limit=${limit}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient