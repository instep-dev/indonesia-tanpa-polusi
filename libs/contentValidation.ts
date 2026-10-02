import type { CollectionDef, FieldType } from '@/data/content-registry'

const MAX_TEXT = 300
const MAX_TEXTAREA = 4000
const MAX_PARAGRAPHS = 12000
const MAX_URL = 2000

// Paths next/image is allow-listed for (see next.config.ts remotePatterns).
const UPLOADED_IMAGE_PATHS = ['/site/', '/articles/']

const isLocalPath = (value: string): boolean => /^\/(?!\/)\S*$/.test(value)

const parseHttpsUrl = (value: string): URL | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

/** Returns an error message, or null when `raw` is acceptable for a field of `type`. Empty is always allowed (means "use default"). */
export const validateValue = (type: FieldType, raw: string): string | null => {
  if (raw === '') return null

  switch (type) {
    case 'text':
      return raw.length > MAX_TEXT ? `Must be at most ${MAX_TEXT} characters` : null

    case 'textarea':
      return raw.length > MAX_TEXTAREA ? `Must be at most ${MAX_TEXTAREA} characters` : null

    case 'paragraphs':
      return raw.length > MAX_PARAGRAPHS ? `Must be at most ${MAX_PARAGRAPHS} characters` : null

    case 'image': {
      if (raw.length > MAX_URL) return 'URL is too long'
      if (isLocalPath(raw)) return null
      const url = parseHttpsUrl(raw)
      if (url && UPLOADED_IMAGE_PATHS.some((prefix) => url.pathname.startsWith(prefix))) return null
      return 'Use an uploaded image (upload it with the image picker)'
    }

    case 'video':
      if (raw.length > MAX_URL) return 'URL is too long'
      return isLocalPath(raw) || parseHttpsUrl(raw) ? null : 'Must be an https:// URL'

    case 'link':
      if (raw.length > MAX_URL) return 'URL is too long'
      if (/^#[\w-]+$/.test(raw) || isLocalPath(raw) || parseHttpsUrl(raw)) return null
      if (/^mailto:[^\s@]+@[^\s@]+$/.test(raw)) return null
      return 'Must be an https:// URL, a /path, an #anchor or a mailto: link'
  }
}

export type LocalizedValue = { id: string; en: string }

export type ItemDataResult =
  | { ok: true; data: Record<string, string | LocalizedValue> }
  | { ok: false; error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Validates and normalises one collection item's `data` against the collection's field definitions. Unknown fields are dropped. */
export const validateItemData = (collection: CollectionDef, input: unknown): ItemDataResult => {
  if (!isRecord(input)) return { ok: false, error: 'data must be an object' }

  const data: Record<string, string | LocalizedValue> = {}

  for (const field of collection.itemFields) {
    const raw = input[field.name]
    const optional = field.optional ?? field.type === 'image'

    if (field.localized) {
      if (!isRecord(raw) || typeof raw.id !== 'string' || typeof raw.en !== 'string') {
        return { ok: false, error: `${field.label} must have Indonesian and English values` }
      }
      const value: LocalizedValue = { id: raw.id.trim(), en: raw.en.trim() }
      if (!optional && !value.id && !value.en) {
        return { ok: false, error: `${field.label} is required` }
      }
      if (field.type === 'select') return { ok: false, error: `${field.label}: a localized select is not supported` }
      for (const text of [value.id, value.en]) {
        const error = validateValue(field.type, text)
        if (error) return { ok: false, error: `${field.label}: ${error}` }
      }
      data[field.name] = value
      continue
    }

    if (typeof raw !== 'string') return { ok: false, error: `${field.label} must be a string` }
    const value = raw.trim()
    if (!optional && !value) return { ok: false, error: `${field.label} is required` }
    if (field.type === 'select') {
      if (value && !field.options?.some((option) => option.value === value)) {
        return { ok: false, error: `${field.label}: choose one of the listed options` }
      }
      data[field.name] = value
      continue
    }
    const error = validateValue(field.type, value)
    if (error) return { ok: false, error: `${field.label}: ${error}` }
    data[field.name] = value
  }

  return { ok: true, data }
}
