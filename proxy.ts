import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'id'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'

// Journalist dashboard paths require auth — no locale prefix (under app/(protected)/)
// Update this list when you add new protected journalist routes
const PROTECTED_PATHS = ['/dashboard', '/settings', '/profile']

// Super admin paths require auth — no locale prefix (under app/(super-admin)/)
const SUPER_ADMIN_PATHS = ['/super-admin']

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

  // Journalist auth routes — skip all processing
  if (pathname.startsWith('/auth')) return NextResponse.next()

  // Super admin auth routes — skip all processing (must be checked before SUPER_ADMIN_PATHS)
  if (pathname.startsWith('/super-admin/auth')) return NextResponse.next()

  // Super admin routes — separate auth guard + redirect target. Uses its own
  // cookie name (not 'refresh_token') so a journalist session in the same
  // browser can't collide with a super admin session.
  if (SUPER_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    const refreshToken = request.cookies.get('super_admin_refresh_token')
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/super-admin/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // Journalist dashboard routes — auth guard, no locale prefix needed
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const refreshToken = request.cookies.get('refresh_token')
    if (!refreshToken) {
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
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|pdf|woff|woff2|ttf|otf)).*)',
  ],
}
