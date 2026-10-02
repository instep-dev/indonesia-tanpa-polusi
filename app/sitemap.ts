import type { MetadataRoute } from 'next'
import { db } from '@/libs/db'
import { hasLocale } from '@/libs/localizeArticle'
import { ALL_LOCALES, SITE_URL } from '@/libs/siteUrl'
import type { Locale } from '@/i18n/getDictionary'

// Articles come from the database, so this is built per request, not at build time.
export const dynamic = 'force-dynamic'

const STATIC_PATHS = ['', '/sulawesi', '/maluku-utara', '/kalimantan-utara', '/news']

const entry = (path: string, locales: readonly Locale[], current: Locale, lastModified?: Date): MetadataRoute.Sitemap[number] => ({
  url: `${SITE_URL}/${current}${path}`,
  ...(lastModified ? { lastModified } : {}),
  alternates: { languages: Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`])) },
})

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const pages = STATIC_PATHS.flatMap((path) => ALL_LOCALES.map((locale) => entry(path, ALL_LOCALES, locale)))

  try {
    const articles = await db.article.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { slug: true, updatedAt: true, titleId: true, titleEn: true, contentId: true, contentEn: true },
      orderBy: { updatedAt: 'desc' },
    })

    const articlePages = articles.flatMap((article) => {
      // Only list the languages the article really exists in.
      const available = ALL_LOCALES.filter((locale) => hasLocale(article, locale))
      return available.map((locale) => entry(`/news/${article.slug}`, available, locale, article.updatedAt))
    })

    return [...pages, ...articlePages]
  } catch (error) {
    console.error('Sitemap: could not load articles, listing static pages only:', error)
    return pages
  }
}

export default sitemap
