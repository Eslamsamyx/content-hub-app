import { getTranslation } from '../../i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import UploadContentEnhanced from '@/components/UploadContentEnhanced'

export default async function UploadPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const { t } = await getTranslation(lng)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Unified background for entire page */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        
        {/* Animated gradient orbs - distributed across the page */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-gradient-to-br from-pink-500/15 to-rose-500/15 rounded-full blur-3xl animate-float animation-delay-4000" />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }} />
      </div>

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
        <UploadContentEnhanced lng={lng} />
      </main>

      <Footer 
        dictionary={{}} 
        lng={lng} 
      />
    </div>
  )
}