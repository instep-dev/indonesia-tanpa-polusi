import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'id'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'

// Protected paths require auth — no locale prefix (under app/(protected)/)
// Update this list when you add new protected routes
const PROTECTED_PATHS = ['/dashboard', '/settings', '/profile', '/admin']

const isLocale = (value: string | undefined): value is Locale =>
  LOCALES.includes(value as Locale)

const detectLocale = (request: NextRequest): Locale => {
  const acceptLang = request.headers.get('accept-language') ?? ''
  const preferred = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase()
  return isLocale(preferred) ? preferred : DEFAULT_LOCALE
}

export const proxy = (request: NextRequest): NextResponse | undefined => {
  const { pathname } = request.nextUrl

  // API routes — skip all processing
  if (pathname.startsWith('/api')) return NextResponse.next()

  // Auth routes — skip all processing
  if (pathname.startsWith('/auth')) return NextResponse.next()

  // Protected routes — auth guard, no locale prefix needed
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  if (isProtected) {
    const session = request.cookies.get('session')
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // All other routes — ensure locale prefix
  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!hasLocale) {
    const locale = detectLocale(request)
    request.nextUrl.pathname = `/${locale}${pathname}`
    return NextResponse.redirect(request.nextUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|pdf|woff|woff2|ttf|otf)).*)',
  ],
}
