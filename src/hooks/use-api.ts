import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api-client'

interface UseApiOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: any | null
  meta?: any
  refetch: () => Promise<void>
}

/**
 * Generic hook for API calls
 */
export function useApi<T = any>(
  fetcher: () => Promise<any>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { immediate = true, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<any | null>(null)

  const execute = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetcher()
      if (response.success) {
        setData(response.data)
        setMeta(response.meta || null)
        onSuccess?.(response.data)
      } else {
        setError(response.error)
        onError?.(response.error)
      }
    } catch (err) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error:', err)
      }
      setError(err)
      onError?.(err)
    } finally {
      setLoading(false)
    }
    // Remove fetcher from dependencies to avoid recreation issues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSuccess, onError])

  useEffect(() => {
    if (immediate) {
      execute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies])

  return {
    data,
    loading,
    error,
    meta,
    refetch: execute
  }
}

/**
 * Hook for mutations (POST, PUT, DELETE)
 */
export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<any>,
  options: {
    onSuccess?: (data: TData) => void
    onError?: (error: any) => void
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any | null>(null)
  const [data, setData] = useState<TData | null>(null)

  const mutate = async (variables: TVariables) => {
    try {
      setLoading(true)
      setError(null)
      console.log('Mutation called with variables:', variables)
      const response = await mutationFn(variables)
      console.log('Mutation response:', response)
      if (response?.success) {
        setData(response.data)
        options.onSuccess?.(response.data)
        return response.data
      } else if (response?.error) {
        setError(response.error)
        options.onError?.(response.error)
        throw response.error
      } else {
        // If no success field, assume the response IS the data
        console.log('Response has no success field, treating as direct data')
        setData(response)
        options.onSuccess?.(response)
        return response
      }
    } catch (err) {
      console.error('Mutation error:', err)
      setError(err)
      options.onError?.(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    mutate,
    loading,
    error,
    data
  }
}

// Specific hooks for common operations

export function useAssetDetail(assetId: string) {
  return useApi(() => apiClient.getAsset(assetId), [assetId])
}

export function useAssets(params?: {
  page?: number
  limit?: number
  type?: string
  category?: string
  tags?: string[]
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}) {
  return useApi(
    () => apiClient.getAssets(params),
    [JSON.stringify(params)]
  )
}

export function useAsset(id: string) {
  return useApi(
    () => apiClient.getAsset(id),
    [id],
    { immediate: !!id }
  )
}

export function useSearch(query: string, filters?: any) {
  return useApi(
    () => apiClient.search(query, filters),
    [query, JSON.stringify(filters)],
    { immediate: query.length > 0 }
  )
}

export function useSearchSuggestions(query: string) {
  return useApi(
    () => apiClient.getSearchSuggestions(query),
    [query],
    { immediate: query.length >= 2 }
  )
}

export function useCollections(params?: {
  page?: number
  limit?: number
  search?: string
}) {
  return useApi(
    () => apiClient.getCollections(params),
    [JSON.stringify(params)]
  )
}

export function useCollection(id: string) {
  return useApi(
    () => apiClient.getCollection(id),
    [id],
    { immediate: !!id }
  )
}

export function useCollectionAssets(collectionId: string, params?: {
  page?: number
  limit?: number
  search?: string
  type?: string
  sortBy?: string
  sortOrder?: string
}) {
  return useApi(
    () => apiClient.getCollectionAssets(collectionId, params),
    [collectionId, JSON.stringify(params)],
    { immediate: !!collectionId }
  )
}

export function useRemoveFromCollection() {
  return useMutation(
    ({ collectionId, assetId }: { collectionId: string; assetId: string }) =>
      apiClient.removeFromCollection(collectionId, assetId)
  )
}

export function useTags(category?: string) {
  return useApi(
    () => apiClient.getTags(category),
    [category]
  )
}

export function useAnalyticsOverview() {
  return useApi(() => apiClient.getAnalyticsOverview())
}

export function useAnalyticsTrends(metric: string, period: string = '30d') {
  return useApi(
    () => apiClient.getAnalyticsTrends(metric, period),
    [metric, period]
  )
}

export function useTopContent(metric: string, limit: number = 10, period?: string) {
  return useApi(
    () => apiClient.getTopContent(metric, limit, period),
    [metric, limit, period]
  )
}

export function useUsers(params?: {
  page?: number
  limit?: number
  role?: string
  department?: string
  search?: string
  status?: string
}) {
  return useApi(
    () => apiClient.getUsers(params),
    [JSON.stringify(params)]
  )
}

export function useProfile() {
  return useApi(() => apiClient.getProfile())
}

export function useNotifications(params?: {
  isRead?: boolean
  type?: string
  page?: number
  limit?: number
}) {
  return useApi(
    () => apiClient.getNotifications(params),
    [JSON.stringify(params)]
  )
}

export function usePendingReviews(params?: {
  page?: number
  limit?: number
}) {
  return useApi(
    () => apiClient.getPendingReviews(params),
    [JSON.stringify(params)]
  )
}

// Mutation hooks

export function useUploadAsset() {
  return useMutation(apiClient.uploadAsset.bind(apiClient))
}

export function useCompleteUpload() {
  return useMutation(apiClient.completeUpload.bind(apiClient))
}

export function useCreateCollection() {
  return useMutation(apiClient.createCollection.bind(apiClient))
}

export function useUpdateCollection() {
  return useMutation((variables: { id: string; data: any }) =>
    apiClient.updateCollection(variables.id, variables.data)
  )
}

export function useAddToCollection() {
  return useMutation((variables: { collectionId: string; assetIds: string[] }) =>
    apiClient.addToCollection(variables.collectionId, variables.assetIds)
  )
}

export function useUpdateProfile() {
  return useMutation(apiClient.updateProfile.bind(apiClient))
}

export function useSubmitForReview() {
  return useMutation((assetId: string) => apiClient.submitForReview(assetId))
}

export function useApproveReview() {
  return useMutation((variables: { id: string; comments?: string }) =>
    apiClient.approveReview(variables.id, variables.comments)
  )
}

export function useRejectReview() {
  return useMutation((variables: { id: string; comments: string; reasons: string[] }) =>
    apiClient.rejectReview(variables.id, variables.comments, variables.reasons)
  )
}

export function useRequestChanges() {
  return useMutation((variables: { id: string; comments: string; requiredChanges: string[] }) =>
    apiClient.requestChanges(variables.id, variables.comments, variables.requiredChanges)
  )
}

export function useMarkNotificationRead() {
  return useMutation((id: string) => apiClient.markNotificationRead(id))
}

export function useMarkAllNotificationsRead() {
  return useMutation(() => apiClient.markAllNotificationsRead())
}

export function useTrackAssetView() {
  return useMutation((id: string) => apiClient.trackAssetView(id))
}

// Additional hooks for connected components

export function useDeleteAsset() {
  return useMutation((id: string) => apiClient.deleteAsset(id))
}

export function usePinCollection() {
  return useMutation((id: string) => apiClient.pinCollection(id))
}

export function useDeleteCollection() {
  return useMutation((id: string) => apiClient.deleteCollection(id))
}

export function useUploadAvatar() {
  return useMutation((file: File) => apiClient.uploadAvatar(file))
}

export function useDeleteAvatar() {
  return useMutation(() => apiClient.deleteAvatar())
}

export function useProfileUploads(params?: {
  page?: number
  limit?: number
}) {
  return useApi(
    () => apiClient.getProfileUploads(params),
    [JSON.stringify(params)]
  )
}

export function useProfileActivity(params?: {
  limit?: number
}) {
  return useApi(
    () => apiClient.getProfileActivity(params),
    [JSON.stringify(params)]
  )
}

export function useUpdateUser() {
  return useMutation((variables: { userId: string; data: any }) =>
    apiClient.updateUser(variables.userId, variables.data)
  )
}

export function useDeleteUser() {
  return useMutation((userId: string) => apiClient.deleteUser(userId))
}

export function useActivateUser() {
  return useMutation((variables: { userId: string; activate: boolean }) =>
    apiClient.toggleUserStatus(variables.userId, variables.activate)
  )
}

// System monitoring hooks
export function useSystemHealth() {
  return useApi(() => apiClient.getSystemHealth())
}

export function useSystemMetrics() {
  return useApi(() => apiClient.getSystemMetrics())
}

// export function useSystemJobs() {
//   return useApi(() => apiClient.getSystemJobs())
// }

export function useSystemErrors() {
  return useApi(() => apiClient.getSystemErrors())
}

// Review workflow hooks
export function useReviewDetail(reviewId: string) {
  return useApi(() => apiClient.getReview(reviewId), [reviewId])
}

export function useApproveAsset() {
  return useMutation((reviewId: string) => apiClient.approveReview(reviewId))
}

export function useRejectAsset() {
  return useMutation((data: { reviewId: string; reasons: string[]; comments: string }) => 
    apiClient.rejectReview(data.reviewId, data.comments, data.reasons)
  )
}

// Analytics hooks

export function useFileTypes() {
  return useApi(() => apiClient.getFileTypes())
}

// Asset download hook
export function useDownloadAsset() {
  return useMutation((id: string) => apiClient.downloadAsset(id))
}