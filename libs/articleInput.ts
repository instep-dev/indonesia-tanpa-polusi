import { isAcceptableImageUrl } from '@/libs/imageHosts'

const MAX_URL = 2000

const LINK_FIELDS = [
  ['reportUrl', 'Report link'],
  ['pressReleaseUrl', 'Press release link'],
  ['visualUrl', 'Visual gallery link'],
] as const

type ArticleLinkInput = {
  coverImage?: unknown
  reportUrl?: unknown
  pressReleaseUrl?: unknown
  visualUrl?: unknown
}

type CurrentLinks = {
  coverImage: string | null
  reportUrl: string | null
  pressReleaseUrl: string | null
  visualUrl: string | null
}

const isEmpty = (value: unknown): boolean => value === undefined || value === null || value === ''

/** Only http(s) — a `javascript:` or `data:` URL must never reach an `href` on the public site. */
const isWebUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Returns an error message when an article's cover image or external links are
 * not acceptable, otherwise null. A value that is unchanged from what is already
 * stored (`current`) is not re-checked, so editing an older article never fails
 * over a value the author did not touch.
 */
export const validateArticleLinks = (input: ArticleLinkInput, current?: CurrentLinks): string | null => {
  for (const [field, label] of LINK_FIELDS) {
    const value = input[field]
    if (isEmpty(value) || value === current?.[field]) continue
    if (typeof value !== 'string' || value.length > MAX_URL || !isWebUrl(value)) {
      return `${label} must be a valid http(s) URL`
    }
  }

  const cover = input.coverImage
  if (!isEmpty(cover) && cover !== current?.coverImage) {
    if (typeof cover !== 'string' || cover.length > MAX_URL || !isAcceptableImageUrl(cover)) {
      return 'Cover image must be an https:// image URL or a /path from the site'
    }
  }

  return null
}
