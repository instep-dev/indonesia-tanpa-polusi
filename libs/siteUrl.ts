import type { Locale } from '@/i18n/getDictionary'

export const SITE_NAME = 'Indonesia Tanpa Polusi'
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://indonesiatanpapolusi.org').replace(/\/+$/, '')

export const ALL_LOCALES: readonly Locale[] = ['en', 'id']
export const OG_LOCALE: Record<Locale, string> = { en: 'en_US', id: 'id_ID' }

export type PageAlternates = { canonical: string; languages: Record<string, string> }

/**
 * Canonical + hreflang alternates for a page (`path` is the part after the locale, e.g. "/news").
 * `available` lists the languages the page really exists in; if the requested language is not one of
 * them, the canonical points at the language that is (so a fallback copy isn't a duplicate page).
 */
export const buildAlternates = (
  path: string,
  current: Locale,
  available: readonly Locale[] = ALL_LOCALES,
): PageAlternates => {
  const languages = available.length > 0 ? available : [current]
  const canonicalLocale = languages.includes(current) ? current : languages[0]
  const defaultLocale = languages.includes('en') ? 'en' : languages[0]

  return {
    canonical: `/${canonicalLocale}${path}`,
    languages: {
      ...Object.fromEntries(languages.map((locale) => [locale, `/${locale}${path}`])),
      'x-default': `/${defaultLocale}${path}`,
    },
  }
}
