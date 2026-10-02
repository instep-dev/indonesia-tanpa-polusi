import { hasLocale } from '@/libs/localizeArticle'
import type { LocalizableArticle } from '@/libs/localizeArticle'
import type { SourceLocale } from '@/services/article/article.dto'

type TitledValues = Pick<LocalizableArticle, 'titleId' | 'titleEn'>

/**
 * `sourceLocale` is no longer a user choice (authors fill both editors); it is the
 * language the article was started in — the first non-empty title, Indonesian by default.
 * It is still stored (slugs, existing rows).
 */
export const deriveSourceLocale = (values: TitledValues): SourceLocale => {
  if (values.titleId.trim()) return 'id'
  if (values.titleEn.trim()) return 'en'
  return 'id'
}

export const LOCALE_NAMES: Record<SourceLocale, string> = { id: 'Indonesian', en: 'English' }

/** Languages in which the article is not complete yet (no title or no content). Empty = fully bilingual. */
export const missingLanguages = (article: LocalizableArticle): SourceLocale[] =>
  (['id', 'en'] as const).filter((locale) => !hasLocale(article, locale))

type DisplayableArticle = TitledValues & { sourceLocale: SourceLocale }

/** The title to show in admin lists: the source language's title, or the other language's when that one is empty. */
export const displayTitle = (article: DisplayableArticle): string => {
  const [first, second] = article.sourceLocale === 'id' ? [article.titleId, article.titleEn] : [article.titleEn, article.titleId]
  return first.trim() ? first : second
}
