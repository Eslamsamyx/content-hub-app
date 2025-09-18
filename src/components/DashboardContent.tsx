'use client'

import { useRouter } from 'next/navigation'
import SearchBar from '@/components/SearchBar'

interface DashboardContentProps {
  lng: string
  searchPlaceholder: string
}

export default function DashboardContent({ lng, searchPlaceholder }: DashboardContentProps) {
  const router = useRouter()

  const handleSearch = (query: string) => {
    // Redirect to explore page with search query
    router.push(`/${lng}/explore?q=${encodeURIComponent(query)}`)
  }

  return (
    <SearchBar 
      placeholder={searchPlaceholder}
      onSearch={handleSearch}
    />
  )
}