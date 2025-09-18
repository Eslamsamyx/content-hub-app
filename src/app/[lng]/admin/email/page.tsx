import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import EmailManagement from '@/components/admin/EmailManagement'

export default async function EmailManagementPage({ 
  params 
}: { 
  params: Promise<{ lng: string }> 
}) {
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
      </div>

      <Navbar lng={lng} translations={translations} />

      <main className="pt-20">
        <EmailManagement lng={lng} />
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}