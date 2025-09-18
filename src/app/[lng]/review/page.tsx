import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ReviewContentConnected from '@/components/review/ReviewContentConnected'

export default async function ReviewPage({ params }: { params: Promise<{ lng: string }> }) {
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
        <ReviewContentConnected lng={lng} />
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}