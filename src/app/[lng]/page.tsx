import { getTranslation } from '../i18n'
import Navbar from '@/components/Navbar'
import HomeContent from '@/components/HomeContent'
import Footer from '@/components/Footer'

export default async function HomePage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const { t } = await getTranslation(lng)

  const translations = {
    // Navbar translations
    home: t('nav.home'),
    explore: t('nav.explore'),
    categories: t('nav.categories'),
    trending: t('nav.collections'),
    upload: t('nav.upload'),
    signIn: t('nav.signIn'),
    signUp: t('nav.signUp'),
    // Home page translations
    hero: {
      title: t('home.hero.title', 'Your Digital Asset Management Hub'),
      subtitle: t('home.hero.subtitle', 'Organize, share, and track all your digital assets in one centralized platform'),
      cta: t('home.hero.cta', 'Get Started'),
      secondaryCta: t('home.hero.secondaryCta', 'Explore Assets')
    },
    features: {
      title: t('home.features.title', 'Everything you need to manage digital assets'),
      subtitle: t('home.features.subtitle', 'Powerful features designed for modern teams'),
      items: [
        {
          title: t('home.features.upload.title', 'Easy Upload'),
          description: t('home.features.upload.description', 'Drag and drop or batch upload your digital assets')
        },
        {
          title: t('home.features.organize.title', 'Smart Organization'),
          description: t('home.features.organize.description', 'Organize with tags, collections, and metadata')
        },
        {
          title: t('home.features.analytics.title', 'Analytics'),
          description: t('home.features.analytics.description', 'Track usage and performance metrics')
        },
        {
          title: t('home.features.collaboration.title', 'Collaboration'),
          description: t('home.features.collaboration.description', 'Share and collaborate with your team')
        },
        {
          title: t('home.features.security.title', 'Secure Storage'),
          description: t('home.features.security.description', 'Enterprise-grade security for your assets')
        },
        {
          title: t('home.features.ai.title', 'AI-Powered'),
          description: t('home.features.ai.description', 'Smart search and automatic tagging')
        }
      ]
    },
    stats: {
      assets: t('home.stats.assets', 'Digital Assets'),
      users: t('home.stats.users', 'Active Users'),
      downloads: t('home.stats.downloads', 'Total Downloads'),
      storage: t('home.stats.storage', 'Storage Capacity')
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar lng={lng} translations={translations} />
      
      <main className="pt-16">
        <HomeContent 
          lng={lng} 
          translations={translations}
        />
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}