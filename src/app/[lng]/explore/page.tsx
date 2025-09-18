import { getTranslation } from '../../i18n'
import Navbar from '@/components/Navbar'
import ExploreContentConnected from '@/components/ExploreContentConnected'
import Footer from '@/components/Footer'

export default async function ExplorePage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ lng: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { lng } = await params
  const urlParams = await searchParams
  const { t } = await getTranslation(lng)
  
  // Get initial filter from URL
  const initialType = urlParams.type as string | undefined


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
      
      <main className="pt-20">
        <ExploreContentConnected 
          lng={lng}
          initialType={initialType}
          translations={{
            searchPlaceholder: t('hero.searchPlaceholder'),
            filters: {
              all: t('assets.filters.all'),
              type: t('assets.filters.type'),
              date: t('assets.filters.date'),
              tags: t('assets.filters.tags'),
              year: t('assets.filters.year'),
              company: t('assets.filters.company')
            },
            sort: {
              newest: t('assets.sort.newest'),
              oldest: t('assets.sort.oldest'),
              name: t('assets.sort.name'),
              popular: t('assets.sort.popular')
            },
            actions: {
              download: t('assets.actions.download'),
              preview: t('assets.actions.preview')
            }
          }}
        />
      </main>
      
      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}