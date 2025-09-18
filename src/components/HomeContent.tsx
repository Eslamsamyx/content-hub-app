'use client'

import Link from 'next/link'
import { 
  ArrowRightIcon, 
  CloudArrowUpIcon, 
  FolderOpenIcon, 
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface HomeContentProps {
  lng: string
  translations: {
    hero: {
      title: string
      subtitle: string
      cta: string
      secondaryCta: string
    }
    features: {
      title: string
      subtitle: string
      items: Array<{
        title: string
        description: string
      }>
    }
    stats: {
      assets: string
      users: string
      downloads: string
      storage: string
    }
  }
}

export default function HomeContent({ lng, translations }: HomeContentProps) {
  const features = [
    {
      icon: CloudArrowUpIcon,
      title: translations.features.items[0]?.title || 'Easy Upload',
      description: translations.features.items[0]?.description || 'Drag and drop or batch upload your digital assets'
    },
    {
      icon: FolderOpenIcon,
      title: translations.features.items[1]?.title || 'Smart Organization',
      description: translations.features.items[1]?.description || 'Organize with tags, collections, and metadata'
    },
    {
      icon: ChartBarIcon,
      title: translations.features.items[2]?.title || 'Analytics',
      description: translations.features.items[2]?.description || 'Track usage and performance metrics'
    },
    {
      icon: UserGroupIcon,
      title: translations.features.items[3]?.title || 'Collaboration',
      description: translations.features.items[3]?.description || 'Share and collaborate with your team'
    },
    {
      icon: ShieldCheckIcon,
      title: translations.features.items[4]?.title || 'Secure Storage',
      description: translations.features.items[4]?.description || 'Enterprise-grade security for your assets'
    },
    {
      icon: SparklesIcon,
      title: translations.features.items[5]?.title || 'AI-Powered',
      description: translations.features.items[5]?.description || 'Smart search and automatic tagging'
    }
  ]

  const stats = [
    { label: translations.stats.assets, value: '50K+' },
    { label: translations.stats.users, value: '1,000+' },
    { label: translations.stats.downloads, value: '2M+' },
    { label: translations.stats.storage, value: '10TB+' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {translations.hero.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto">
              {translations.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${lng}/signup`}
                className="inline-flex items-center px-8 py-3 text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors"
              >
                {translations.hero.cta}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href={`/${lng}/explore`}
                className="inline-flex items-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {translations.hero.secondaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {translations.features.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {translations.features.subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to streamline your digital asset management?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of teams already using Content Hub to organize, share, and track their digital assets.
          </p>
          <Link
            href={`/${lng}/signup`}
            className="inline-flex items-center px-8 py-3 text-base font-medium rounded-lg text-white bg-primary hover:bg-primary-dark transition-colors"
          >
            Get Started Free
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}