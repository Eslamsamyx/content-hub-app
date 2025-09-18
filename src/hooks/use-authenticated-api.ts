import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/api-client'

/**
 * Hook that only fetches notifications when user is authenticated
 * Returns null data when not authenticated
 */
export function useAuthenticatedNotifications(params?: {
  isRead?: boolean
  type?: string
  page?: number
  limit?: number
}) {
  const { data: session, status } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)
  
  const paramsString = JSON.stringify(params)
  
  const fetchNotifications = useCallback(async () => {
    // Don't fetch if not authenticated
    if (status !== 'authenticated' || !session) {
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.getNotifications(JSON.parse(paramsString))
      if (response.success) {
        setData((response.data as any)?.notifications || response.data)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [status, session, paramsString])
  
  useEffect(() => {
    // Only fetch if authenticated
    if (status === 'authenticated' && session) {
      fetchNotifications()
    }
  }, [status, session, fetchNotifications])
  
  return {
    data,
    loading,
    error,
    refetch: fetchNotifications
  }
}