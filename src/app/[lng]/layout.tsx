import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { languages } from '../i18n/settings'
import AnimatedBackgroundCSS from '@/components/AnimatedBackgroundCSS'
import WireAnimationV2 from '@/components/WireAnimationV2'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ToastProvider } from '@/contexts/ToastContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

export async function generateMetadata({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  return {
    title: lng === 'en' ? 'Content Hub - Multilingual App' : 'Content Hub - Application Multilingue',
    description: lng === 'en' ? 'A Next.js multilingual application' : 'Une application Next.js multilingue',
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: 'any' }
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
      ],
      other: [
        { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
        { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' }
      ]
    },
    manifest: '/site.webmanifest',
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}) {
  const { lng } = await params
  return (
    <html lang={lng}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ToastProvider>
            {/* <div className="fixed inset-0 bg-background -z-20" /> */}
            <AnimatedBackgroundCSS />
            <WireAnimationV2 />
            <div className="relative z-10">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}