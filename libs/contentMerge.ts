import { contactInfo, homeStoryCards, regionStories } from '@/data/data'
import type { RegionKey } from '@/data/data'
import {
  DEFAULT_SOCIAL_PLATFORM,
  defaultStoryImages,
  fieldsByKey,
  isValueField,
  socialPlatforms,
  valueDefaults,
} from '@/data/content-registry'
import type { FieldDef, SocialPlatform, ValueKey } from '@/data/content-registry'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import { getByPath, setStringArrayByPath, setStringByPath } from '@/libs/contentPath'
import { splitParagraphs } from '@/libs/paragraphs'
import { isFieldSnapshot } from '@/libs/revisionSnapshots'

// Pure merge logic: built-in defaults + DB rows → what the public pages render.
// No DB access here (see libs/siteContent.ts) so it is trivially unit-testable.

export type ContentRow = { key: string; valueId: string | null; valueEn: string | null }
export type ItemRow = { id: string; collection: string; order: number; data: unknown }

export type SiteValues = Record<ValueKey, string>
export type StoryItem = { id: string; name: string; quote: string; imageUrl: string }
export type SocialItem = { id: string; handle: string; href: string; platform: SocialPlatform }

const toPlatform = (value: string): SocialPlatform =>
  socialPlatforms.find((platform) => platform.value === value)?.value ?? DEFAULT_SOCIAL_PLATFORM

const isValueKey = (key: string): key is ValueKey => Object.hasOwn(valueDefaults, key)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The row's value for this locale, or null when empty (→ fall back to the default). */
const rowValue = (row: ContentRow, field: FieldDef, locale: Locale): string | null => {
  const raw = field.localized && locale === 'en' ? row.valueEn : row.valueId
  return raw && raw.trim() ? raw : null
}

/** Deep-clones `base` and overwrites every message-backed registry field that has a DB value. */
export const applyDictionaryOverrides = (
  base: Dictionary,
  rows: ContentRow[],
  locale: Locale,
): Dictionary => {
  const dict = structuredClone(base)

  for (const row of rows) {
    const field = fieldsByKey.get(row.key)
    if (!field || isValueField(field)) continue
    const value = rowValue(row, field, locale)
    if (value === null) continue
    if (field.type === 'paragraphs') setStringArrayByPath(dict, field.key, splitParagraphs(value))
    else setStringByPath(dict, field.key, value)
  }

  return dict
}



/** Media/link/email values: registry default, overridden by any non-empty DB row. */
export const resolveValues = (rows: ContentRow[], locale: Locale): SiteValues => {
  const values: SiteValues = { ...valueDefaults }

  for (const row of rows) {
    if (!isValueKey(row.key)) continue
    const field = fieldsByKey.get(row.key)
    if (!field) continue
    const value = rowValue(row, field, locale)
    if (value !== null) values[row.key] = value
  }

  return values
}

/** Drafts replace the published rows with the same key; a draft with no values means "back to the default". */
export const applyDrafts = (
  rows: ContentRow[],
  drafts: Array<{ targetKey: string; snapshot: unknown }>,
): ContentRow[] => {
  const valid = drafts.flatMap((draft) =>
    isFieldSnapshot(draft.snapshot) ? [{ key: draft.targetKey, ...draft.snapshot }] : [],
  )
  const draftKeys = new Set(valid.map((draft) => draft.key))
  const published = rows.filter((row) => !draftKeys.has(row.key))
  const overrides = valid.filter((draft) => draft.valueId !== null || draft.valueEn !== null)
  return [...published, ...overrides.map(({ key, valueId, valueEn }) => ({ key, valueId, valueEn }))]
}

// ─── Derived shapes for specific components ───────────────────────────────

export type LogoSet = { overHero: string; scrolled: string }
export type NavLogos = Record<'default' | RegionKey, LogoSet>

export const buildNavLogos = (values: SiteValues): NavLogos => ({
  default: {
    overHero: values['media.logos.default.overHero'],
    scrolled: values['media.logos.default.scrolled'],
  },
  sulawesi: {
    overHero: values['media.logos.sulawesi.overHero'],
    scrolled: values['media.logos.sulawesi.scrolled'],
  },
  malukuUtara: {
    overHero: values['media.logos.malukuUtara.overHero'],
    scrolled: values['media.logos.malukuUtara.scrolled'],
  },
  kalimantanUtara: {
    overHero: values['media.logos.kalimantanUtara.overHero'],
    scrolled: values['media.logos.kalimantanUtara.scrolled'],
  },
})

export type ContactCollage = [string, string, string, string]

export const buildCollage = (values: SiteValues): ContactCollage => [
  values['media.contact.collage1'],
  values['media.contact.collage2'],
  values['media.contact.collage3'],
  values['media.contact.collage4'],
]

// ─── Collections ──────────────────────────────────────────────────────────

const readString = (data: Record<string, unknown>, name: string): string => {
  const raw = data[name]
  return typeof raw === 'string' ? raw : ''
}

const readLocalized = (data: Record<string, unknown>, name: string, locale: Locale): string => {
  const raw = data[name]
  if (!isRecord(raw)) return ''
  const preferred = raw[locale]
  const other = raw[locale === 'en' ? 'id' : 'en']
  if (typeof preferred === 'string' && preferred) return preferred
  return typeof other === 'string' ? other : ''
}

const itemsOf = (rows: ItemRow[], collection: string): Array<{ id: string; data: Record<string, unknown> }> =>
  rows
    .filter((row) => row.collection === collection && isRecord(row.data))
    .sort((a, b) => a.order - b.order)
    .flatMap((row) => (isRecord(row.data) ? [{ id: row.id, data: row.data }] : []))

const regionOf = (collection: string): RegionKey | null => {
  const key = collection.slice('stories.'.length)
  return key === 'sulawesi' || key === 'malukuUtara' || key === 'kalimantanUtara' ? key : null
}

type StorySource = { names: Array<{ id: string; name: string }>; quotes: Array<{ quote: string }> }

const storySource = (collection: string, dict: Dictionary): StorySource => {
  const home = dict.marketing.home
  if (collection === 'stories.home') return { names: homeStoryCards, quotes: home.ourStories.cards }

  const region = regionOf(collection)
  if (!region) return { names: [], quotes: [] }
  return { names: regionStories[region], quotes: home.regions[region].ourStories.cards }
}

/** Built-in story cards (what OurStories hardcoded before the CMS), for one collection. */
export const defaultStories = (collection: string, dict: Dictionary): StoryItem[] => {
  const { names, quotes } = storySource(collection, dict)

  return names.map((card, index) => ({
    id: card.id,
    name: card.name,
    quote: quotes[index]?.quote ?? '',
    imageUrl: defaultStoryImages[index] ?? '',
  }))
}

/** DB story cards for a collection, or the built-in cards when none are stored. */
export const resolveStories = (
  collection: string,
  rows: ItemRow[],
  locale: Locale,
  baseDict: Dictionary,
): StoryItem[] => {
  const stored = itemsOf(rows, collection)
  if (stored.length === 0) return defaultStories(collection, baseDict)

  return stored.map(({ id, data }, index) => ({
    id,
    name: readString(data, 'name'),
    quote: readLocalized(data, 'quote', locale),
    imageUrl: readString(data, 'imageUrl') || defaultStoryImages[index] || '',
  }))
}

/** DB social accounts, or the built-in list when none are stored. */
export const resolveSocials = (rows: ItemRow[]): SocialItem[] => {
  const stored = itemsOf(rows, 'contact.socials')
  if (stored.length === 0) {
    return contactInfo.socials.map((social) => ({ id: social.handle, ...social, platform: DEFAULT_SOCIAL_PLATFORM }))
  }
  return stored.map(({ id, data }) => ({
    id,
    handle: readString(data, 'handle'),
    href: readString(data, 'href'),
    // Missing/unknown platform = Instagram, which is what every account used before the picker existed.
    platform: toPlatform(readString(data, 'platform')),
  }))
}

/** Reads a message-backed default straight from a dictionary (used by the seed + admin editor). */
export const defaultCopy = (dict: Dictionary, key: string): string => {
  const value = getByPath(dict, key)
  if (typeof value === 'string') return value
  // Multi-paragraph copy is stored as an array of strings in messages/*.json.
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) return value.join('\n\n')
  return ''
}

// ─── Defaults as storable rows (admin editor + insert-only seed) ──────────

/** The built-in value of a registry field, per locale. */
export const defaultFieldValue = (
  field: FieldDef,
  dictId: Dictionary,
  dictEn: Dictionary,
): { valueId: string; valueEn: string } => {
  if (isValueField(field)) {
    const fallback = field.fallback ?? ''
    return { valueId: fallback, valueEn: fallback }
  }
  return { valueId: defaultCopy(dictId, field.key), valueEn: defaultCopy(dictEn, field.key) }
}

export type StoredItemData = Record<string, string | { id: string; en: string }>

/** The built-in items of a collection, in the shape stored in ContentItem.data. */
export const defaultItemData = (
  collection: string,
  dictId: Dictionary,
  dictEn: Dictionary,
): StoredItemData[] => {
  if (collection === 'contact.socials') {
    return contactInfo.socials.map((social) => ({
      handle: social.handle,
      href: social.href,
      platform: DEFAULT_SOCIAL_PLATFORM,
    }))
  }

  const inId = defaultStories(collection, dictId)
  const inEn = defaultStories(collection, dictEn)
  return inId.map((story, index) => ({
    quote: { id: story.quote, en: inEn[index]?.quote ?? story.quote },
    name: story.name,
    imageUrl: story.imageUrl,
  }))
}
