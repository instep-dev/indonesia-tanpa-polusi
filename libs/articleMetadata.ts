import type { Metadata } from 'next'
import { hasLocale, pickLocale } from '@/libs/localizeArticle'
import type { LocalizableArticle } from '@/libs/localizeArticle'
import { ALL_LOCALES, OG_LOCALE, SITE_NAME, buildAlternates } from '@/libs/siteUrl'
import type { Locale } from '@/i18n/getDictionary'

type ArticleForMetadata = LocalizableArticle & {
  slug: string
  coverImage: string | null
  publishedAt: string | null
  updatedAt: string
}

const MAX_DESCRIPTION = 200

const truncate = (text: string): string =>
  text.length <= MAX_DESCRIPTION ? text : `${text.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`

/**
 * Title, description, social-share card, canonical and hreflang for one article page.
 *  - A language the article was never written in falls back to the other language's text
 *    (same rule as the page itself) — but that fallback copy is `noindex` and canonicalises to
 *    the real language, so search engines don't see two identical pages.
 *  - hreflang alternates list only the languages that really exist.
 */
export const buildArticleMetadata = (article: ArticleForMetadata, locale: Locale): Metadata => {
  const { title, excerpt, isFallback } = pickLocale(article, locale)
  const available = ALL_LOCALES.filter((candidate) => hasLocale(article, candidate))
  const alternates = buildAlternates(`/news/${article.slug}`, locale, available)
  const description = truncate(excerpt)
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME

  return {
    title: fullTitle,
    description,
    alternates,
    ...(isFallback || available.length === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      title,
      description,
      url: alternates.canonical,
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      modifiedTime: article.updatedAt,
      ...(article.coverImage ? { images: [{ url: article.coverImage }] } : {}),
    },
    twitter: {
      card: article.coverImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(article.coverImage ? { images: [article.coverImage] } : {}),
    },
  }
}
