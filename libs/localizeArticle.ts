import { hasContent } from '@/libs/tiptapText'
import type { Locale } from '@/i18n/getDictionary'

// Articles store both languages side by side, but a language can be empty (the
// author wrote only one, or never translated). The public site then shows the
// other language instead of a blank — this is that rule, in one place.
// Pure on purpose (no server imports): it runs in client components too.

export type LocalizableArticle = {
  titleId: string
  titleEn: string
  excerptId: string
  excerptEn: string
  contentId: unknown
  contentEn: unknown
}

export type LocalizedArticle = {
  title: string
  excerpt: string
  content: unknown
  /** The language each part is actually written in (use for `lang="…"` when it differs from the page). */
  titleLocale: Locale
  excerptLocale: Locale
  contentLocale: Locale
  /** True when any part fell back to the other language. */
  isFallback: boolean
}

const otherLocale = (locale: Locale): Locale => (locale === 'id' ? 'en' : 'id')

// Each part falls back independently: a missing English excerpt shouldn't hide an English title.
const pickText = (locale: Locale, id: string, en: string): { value: string; locale: Locale } => {
  const own = locale === 'id' ? id : en
  const alternative = locale === 'id' ? en : id
  return !own.trim() && alternative.trim()
    ? { value: alternative, locale: otherLocale(locale) }
    : { value: own, locale }
}

export const pickLocale = (article: LocalizableArticle, locale: Locale): LocalizedArticle => {
  const title = pickText(locale, article.titleId, article.titleEn)
  const excerpt = pickText(locale, article.excerptId, article.excerptEn)

  const own = locale === 'id' ? article.contentId : article.contentEn
  const alternative = locale === 'id' ? article.contentEn : article.contentId
  const contentFallsBack = !hasContent(own) && hasContent(alternative)

  return {
    title: title.value,
    excerpt: excerpt.value,
    content: contentFallsBack ? alternative : own,
    titleLocale: title.locale,
    excerptLocale: excerpt.locale,
    contentLocale: contentFallsBack ? otherLocale(locale) : locale,
    isFallback: title.locale !== locale || excerpt.locale !== locale || contentFallsBack,
  }
}

/** True when the article really exists in this language (a title and some content), e.g. for hreflang alternates. */
export const hasLocale = (
  article: Pick<LocalizableArticle, 'titleId' | 'titleEn' | 'contentId' | 'contentEn'>,
  locale: Locale,
): boolean => {
  const title = locale === 'id' ? article.titleId : article.titleEn
  const content = locale === 'id' ? article.contentId : article.contentEn
  return !!title.trim() && hasContent(content)
}
