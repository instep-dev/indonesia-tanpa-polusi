// Image URLs used by articles and CMS content can come from three places:
//   1. this site's own `public/` folder ("/news1.jpg") — older articles and built-in defaults
//   2. any other site over https (Cloudinary, Unsplash, a CDN, …)
//   3. our R2 bucket (uploads through the image picker)
// next/image only optimizes hosts listed in next.config.ts `remotePatterns`, so
// `shouldSkipImageOptimization` tells the renderer to serve everything else as-is.

// Hosts/paths next.config.ts `images.remotePatterns` allows. Keep in step with it.
const OPTIMIZED_IMAGE_HOSTS = ['indonesiatanpapolusi.org', 'media.indonesiatanpapolusi.org']
const OPTIMIZED_IMAGE_PATHS = ['/site/', '/articles/']

// Starts with a single "/" — "//host" and "/\host" are both read by browsers as another host.
const LOCAL_IMAGE_PATH = /^\/(?![\/\\])/
const CONTROL_CHARACTERS = /[\x00-\x1f\x7f]/

/** A path inside this site's `public/` folder, e.g. `/news1.jpg` (a leading `//` would be another host). */
export const isLocalImagePath = (value: string): boolean => LOCAL_IMAGE_PATH.test(value)

/**
 * Whether `raw` may be stored as an image: a `public/` path or an https URL on any
 * host. https only, so it can never be a `javascript:` / `data:` URL (and plain
 * `http:` would be blocked as mixed content on our https site). Control characters
 * and leading/trailing spaces are refused (a pasted newline is never intended).
 *
 * Quotes, parentheses and other URL punctuation are fine here — the one place that
 * puts a cover into CSS (`LatestNewsList`) quotes and escapes it.
 */
export const isAcceptableImageUrl = (raw: string): boolean => {
  if (CONTROL_CHARACTERS.test(raw) || raw !== raw.trim()) return false
  if (isLocalImagePath(raw)) return true
  try {
    return new URL(raw).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * A CSS `url("…")` value for an image URL, safe to put in an inline style: the URL is
 * quoted and its quotes/backslashes escaped, so it cannot end the declaration early
 * and inject other CSS properties.
 */
export const toCssUrl = (src: string): string => `url(${JSON.stringify(src)})`

/**
 * True when next/image must NOT run this src through its optimizer: an absolute URL
 * outside the hosts/paths in next.config.ts `remotePatterns`. The optimizer rejects
 * those (a broken image in production, an error in dev); `unoptimized` serves the URL
 * as-is instead. Deliberately independent of env vars — client components call this
 * too, and the server and client must agree.
 */
export const shouldSkipImageOptimization = (src: string): boolean => {
  if (isLocalImagePath(src)) return false
  try {
    const url = new URL(src)
    const optimizable =
      OPTIMIZED_IMAGE_HOSTS.includes(url.hostname) && OPTIMIZED_IMAGE_PATHS.some((prefix) => url.pathname.startsWith(prefix))
    return !optimizable
  } catch {
    return false
  }
}
