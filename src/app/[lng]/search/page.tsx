import { getTranslation } from '@/app/i18n'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchContentConnected from '@/components/search/SearchContentConnected'

export default async function SearchPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const { t } = await getTranslation(lng)

  const translations = {
    home: t('nav.home'),
    explore: t('nav.explore'),
    categories: t('nav.categories'),
    trending: t('nav.collections'),
    upload: t('nav.upload'),
    signIn: t('nav.signIn'),
    signUp: t('nav.signUp')
  }


  return (
    <div className="min-h-screen">
      <Navbar lng={lng} translations={translations} />

      <main className="pt-20">
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
          <SearchContentConnected lng={lng} />
        </Suspense>
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}