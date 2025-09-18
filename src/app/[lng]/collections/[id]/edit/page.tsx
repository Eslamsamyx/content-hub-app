import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EditCollectionContent from '@/components/collections/EditCollectionContent'

export default async function EditCollectionPage({ 
  params 
}: { 
  params: Promise<{ lng: string; id: string }> 
}) {
  const { lng, id } = await params
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
        <EditCollectionContent lng={lng} collectionId={id} />
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}