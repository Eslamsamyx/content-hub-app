import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fallbackLng, languages } from '@/app/i18n/settings'
import { withAuth } from 'next-auth/middleware'

// Protected routes that require authentication
const protectedPaths = [
  '/dashboard',
  '/library',
  '/upload',
  '/analytics',
  '/settings',
  '/users',
  '/review',
]

// Public routes that should redirect if authenticated
const authPaths = ['/login', '/signup']

export default withAuth(
  function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const token = (request as any).nextauth?.token
    const isAuth = !!token
    
    // Handle language redirect
    const pathnameIsMissingLocale = languages.every(
      (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    if (pathnameIsMissingLocale) {
      const locale = fallbackLng
      return NextResponse.redirect(
        new URL(`/${locale}${pathname}`, request.url)
      )
    }

    // Extract language and path
    const [, lng, ...pathSegments] = pathname.split('/')
    const pathWithoutLang = '/' + pathSegments.join('/')

    // Check if it's an auth page (login/signup)
    const isAuthPage = authPaths.some(path => pathWithoutLang.startsWith(path))
    
    // Check if it's a protected page
    const isProtectedPage = protectedPaths.some(path => pathWithoutLang.startsWith(path))

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL(`/${lng}/dashboard`, request.url))
    }

    // Redirect unauthenticated users to login
    if (isProtectedPage && !isAuth) {
      let from = pathname
      if (request.nextUrl.search) {
        from += request.nextUrl.search
      }
      return NextResponse.redirect(
        new URL(`/${lng}/login?from=${encodeURIComponent(from)}`, request.url)
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle all logic
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|metafactory-booth|.*\.glb$|.*\.gltf$|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.svg$|.*\.webp$).*)',
  ],
}