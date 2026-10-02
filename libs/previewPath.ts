// Preview links may only lead to public marketing pages: "/en", "/id/news/some-slug", …
// (a locale, then lowercase path segments — no query, no host, no dots, so no open redirect).
const PREVIEW_PATH = /^\/(en|id)(\/[a-z0-9][a-z0-9-]*)*$/

export const isPreviewPath = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 200 && PREVIEW_PATH.test(value)
