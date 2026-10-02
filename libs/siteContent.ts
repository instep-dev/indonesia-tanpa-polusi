import { cache } from 'react'
import { draftMode } from 'next/headers'
import type { Metadata } from 'next'
import { db } from '@/libs/db'
import { getDictionary } from '@/i18n/getDictionary'
import { OG_LOCALE, SITE_NAME, buildAlternates } from '@/libs/siteUrl'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import {
  applyDictionaryOverrides,
  applyDrafts,
  resolveSocials,
  resolveStories,
  resolveValues,
} from '@/libs/contentMerge'
import type { ContentRow, ItemRow, SiteValues, SocialItem, StoryItem } from '@/libs/contentMerge'

// Server-side loaders for CMS-managed public content. Every loader falls back to
// the built-in defaults (messages/*.json + data/*), so an empty table, a missing
// row — or a database outage — never breaks or changes the public site.

type StoredContent = { fields: ContentRow[]; items: ItemRow[] }

/** True while the super-admin is previewing unpublished drafts (Next draft mode). Never throws. */
export const isPreviewMode = async (): Promise<boolean> => {
  try {
    return (await draftMode()).isEnabled
  } catch {
    return false // not inside a request (e.g. static generation)
  }
}

// One query per table per request, shared by every loader below.
const loadStored = cache(async (): Promise<StoredContent> => {
  try {
    const previewing = await isPreviewMode()
    const [publishedFields, items, drafts] = await Promise.all([
      db.siteContent.findMany({ select: { key: true, valueId: true, valueEn: true } }),
      db.contentItem.findMany({
        where: { deletedAt: null },
        select: { id: true, collection: true, order: true, data: true },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      }),
      previewing
        ? db.contentRevision.findMany({ where: { kind: 'field', status: 'DRAFT' }, select: { targetKey: true, snapshot: true } })
        : Promise.resolve([]),
    ])
    // Visitors always get the published rows; only a previewing admin sees drafts on top.
    return { fields: previewing ? applyDrafts(publishedFields, drafts) : publishedFields, items }
  } catch (error) {
    console.error('Failed to load site content, using built-in defaults:', error)
    return { fields: [], items: [] }
  }
})

/** The locale dictionary with CMS copy applied. Same shape/type as getDictionary(). */
export const getSiteDictionary = async (locale: Locale): Promise<Dictionary> => {
  const [base, stored] = await Promise.all([getDictionary(locale), loadStored()])
  return applyDictionaryOverrides(base, stored.fields, locale)
}

/** Media URLs, links and other non-copy values (hero video, images, logos, email…). */
export const getSiteValues = async (locale: Locale): Promise<SiteValues> => {
  const stored = await loadStored()
  return resolveValues(stored.fields, locale)
}

/** Story cards for `stories.home` / `stories.<regionKey>`. */
export const getStories = async (collection: string, locale: Locale): Promise<StoryItem[]> => {
  const [base, stored] = await Promise.all([getDictionary(locale), loadStored()])
  return resolveStories(collection, stored.items, locale, base)
}

/** Footer social accounts. */
export const getSocials = async (): Promise<SocialItem[]> => {
  const stored = await loadStored()
  return resolveSocials(stored.items)
}

export type SeoPage = 'home' | 'sulawesi' | 'malukuUtara' | 'kalimantanUtara' | 'news'

// URL path (after the locale) of each page that has SEO settings.
const SEO_PATHS: Record<SeoPage, string> = {
  home: '',
  sulawesi: '/sulawesi',
  malukuUtara: '/maluku-utara',
  kalimantanUtara: '/kalimantan-utara',
  news: '/news',
}

/** `generateMetadata` helper — title/description/OG image from the SEO section of the CMS, plus canonical + hreflang. */
export const getPageMetadata = async (page: SeoPage, locale: Locale): Promise<Metadata> => {
  const [dict, values] = await Promise.all([getSiteDictionary(locale), getSiteValues(locale)])
  const { title, description } = dict.marketing.seo[page]
  const ogImage = values[`seo.${page}.ogImage`]
  const alternates = buildAlternates(SEO_PATHS[page], locale)

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      title,
      description,
      url: alternates.canonical,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}
