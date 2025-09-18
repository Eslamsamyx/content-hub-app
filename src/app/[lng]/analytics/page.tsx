import { getTranslation } from '@/app/i18n'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import AnalyticsContentConnected from '@/components/analytics/AnalyticsContentConnected'

export default async function AnalyticsPage({ params }: { params: Promise<{ lng: string }> }) {
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
        <AnalyticsContentConnected 
          lng={lng}
          translations={{
            title: t('analytics.title'),
            overview: t('analytics.overview'),
            trends: t('analytics.trends'),
            topContent: t('analytics.topContent'),
            fileTypes: t('analytics.fileTypes'),
            period: {
              '7d': t('analytics.period.7d'),
              '30d': t('analytics.period.30d'),
              '90d': t('analytics.period.90d'),
              '1y': t('analytics.period.1y')
            },
            metrics: {
              uploads: t('analytics.metrics.uploads'),
              downloads: t('analytics.metrics.downloads'),
              views: t('analytics.metrics.views'),
              shares: t('analytics.metrics.shares'),
              storage: t('analytics.metrics.storage'),
              users: t('analytics.metrics.users')
            },
            loading: t('common.loading'),
            error: t('common.error'),
            noData: t('common.noData')
          }}
        />
      </main>

      <Footer dictionary={{}} lng={lng} />
    </div>
  )
}