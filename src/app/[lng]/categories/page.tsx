import { getTranslation } from '../../i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CategoriesHero from '@/components/CategoriesHero'
import CategoryCard from '@/components/CategoryCard'
import Link from 'next/link'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getCategoryStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public/categories/stats`, {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Failed to fetch')
    const data = await res.json()
    return data.data
  } catch (error) {
    console.error('Error fetching category stats:', error)
    // Return default values if API fails
    return {
      categories: [
        { id: 'video', count: 0 },
        { id: 'image', count: 0 },
        { id: '3d', count: 0 },
        { id: 'design', count: 0 },
        { id: 'audio', count: 0 },
        { id: 'document', count: 0 }
      ],
      totalAssets: 0
    }
  }
}

export default async function CategoriesPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const { t } = await getTranslation(lng)
  const stats = await getCategoryStats()

  const categories = [
    { 
      id: 'video',
      name: t('categories.video.title'), 
      description: t('categories.video.description'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      gradientColors: 'from-red-500 via-pink-500 to-rose-500',
      shadowColor: 'shadow-red-500/20',
      glowColor: 'red',
      count: stats.categories.find((c: any) => c.id === 'video')?.count || 0
    },
    { 
      id: 'image',
      name: t('categories.image.title'), 
      description: t('categories.image.description'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      gradientColors: 'from-blue-500 via-cyan-500 to-sky-500',
      shadowColor: 'shadow-blue-500/20',
      glowColor: 'blue',
      count: stats.categories.find((c: any) => c.id === 'image')?.count || 0
    },
    { 
      id: '3d',
      name: t('categories.3d.title'), 
      description: t('categories.3d.description'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      gradientColors: 'from-purple-500 via-violet-500 to-indigo-500',
      shadowColor: 'shadow-purple-500/20',
      glowColor: 'purple',
      count: stats.categories.find((c: any) => c.id === '3d')?.count || 0
    },
    { 
      id: 'design',
      name: t('categories.design.title'), 
      description: t('categories.design.description'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      gradientColors: 'from-green-500 via-emerald-500 to-teal-500',
      shadowColor: 'shadow-green-500/20',
      glowColor: 'green',
      count: stats.categories.find((c: any) => c.id === 'design')?.count || 0
    },
    { 
      id: 'audio',
      name: t('categories.audio.title'), 
      description: t('categories.audio.description'),
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      gradientColors: 'from-yellow-500 via-amber-500 to-orange-500',
      shadowColor: 'shadow-yellow-500/20',
      glowColor: 'yellow',
      count: stats.categories.find((c: any) => c.id === 'audio')?.count || 0
    },
    { 
      id: 'document',
      name: 'Documents', 
      description: 'PDF files, presentations, and text documents',
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradientColors: 'from-gray-500 via-slate-500 to-zinc-500',
      shadowColor: 'shadow-gray-500/20',
      glowColor: 'gray',
      count: stats.categories.find((c: any) => c.id === 'document')?.count || 0
    },
  ]

  const totalAssets = stats.totalAssets || 0

  return (
    <div className="min-h-screen">
      <Navbar 
        lng={lng} 
        translations={{
          home: t('nav.home'),
          explore: t('nav.explore'),
          categories: t('nav.categories'),
          trending: t('nav.collections'),
          upload: t('nav.upload'),
          signIn: t('nav.signIn'),
          signUp: t('nav.signUp')
        }} 
      />
      
      <main className="pt-16">
        {/* Hero Section */}
        <CategoriesHero categories={categories} totalAssets={totalAssets} />

        {/* Categories Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                description={category.description}
                icon={category.icon}
                gradientColors={category.gradientColors}
                shadowColor={category.shadowColor}
                count={category.count}
                href={`/${lng}/explore?type=${category.id}`}
              />
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="bg-gray-50 dark:bg-gray-900/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Access Availability</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">40+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">File Formats</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-2">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cloud Storage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">Secure</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Enterprise Grade</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Can&apos;t find what you&apos;re looking for?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Use our advanced search and filtering options to discover the perfect asset for your project
            </p>
            <Link
              href={`/${lng}/explore`}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 hover:shadow-xl hover:shadow-primary/25"
            >
              Browse All Assets
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </section>
      </main>

      <Footer 
        dictionary={{}} 
        lng={lng} 
      />
    </div>
  )
}