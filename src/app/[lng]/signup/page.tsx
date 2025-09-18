import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import InviteSignupContent from '@/components/auth/InviteSignupContent'
import Footer from '@/components/Footer'

interface SignupPageProps {
  params: Promise<{ lng: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function SignupPage({ params, searchParams }: SignupPageProps) {
  const { lng } = await params
  const { token } = await searchParams
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
      <main className="flex-1 flex items-center justify-center pt-16 py-12">
        <InviteSignupContent lng={lng} token={token} />
      </main>
      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}