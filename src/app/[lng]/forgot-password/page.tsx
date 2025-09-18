import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import ForgotPasswordContent from '@/components/auth/ForgotPasswordContent'
import Footer from '@/components/Footer'

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const { t } = await getTranslation(lng)

  const translations = {
    home: t('nav.home'),
    explore: t('nav.explore'),
    categories: t('nav.categories'),
    trending: t('nav.collections'),
    upload: t('nav.upload'),
    signIn: t('nav.signIn'),
    signUp: t('nav.signUp'),
    profile: t('nav.profile'),
    settings: t('nav.settings'),
    signOut: t('nav.signOut'),
    dashboard: t('nav.dashboard'),
    collections: t('nav.collections'),
    favorites: t('nav.favorites'),
    analytics: t('nav.analytics')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar lng={lng} translations={translations} />
      <main className="flex-1 flex items-center justify-center pt-16">
        <ForgotPasswordContent lng={lng} />
      </main>
      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}