import { collectionsById } from '@/data/content-registry'
import { validateItemData, validateValue } from '@/libs/contentValidation'
import { isAcceptableImageUrl, isLocalImagePath, shouldSkipImageOptimization, toCssUrl } from '@/libs/imageHosts'
import { validateArticleLinks } from '@/libs/articleInput'
import { ACCEPTED_IMAGE_URLS, REJECTED_IMAGE_URLS } from '../image-urls'

const stories = collectionsById.get('stories.home')!

describe('isAcceptableImageUrl', () => {
  it.each(ACCEPTED_IMAGE_URLS)('accepts %s', (_label, url) => {
    expect(isAcceptableImageUrl(url)).toBe(true)
  })

  it.each(REJECTED_IMAGE_URLS)('rejects %s', (_label, url) => {
    expect(isAcceptableImageUrl(url)).toBe(false)
  })

  it('rejects an empty value (callers treat empty as "no image" before asking)', () => {
    expect(isAcceptableImageUrl('')).toBe(false)
  })

  it('rejects surrounding whitespace and newlines', () => {
    for (const url of [' https://example.org/a.jpg', 'https://example.org/a.jpg ', 'https://example.org/a.jpg\n', ' /news1.jpg']) {
      expect(isAcceptableImageUrl(url)).toBe(false)
    }
  })
})

describe('article cover image (validateArticleLinks)', () => {
  it.each(ACCEPTED_IMAGE_URLS)('accepts %s', (_label, url) => {
    expect(validateArticleLinks({ coverImage: url })).toBeNull()
  })

  it.each(REJECTED_IMAGE_URLS)('rejects %s', (_label, url) => {
    expect(validateArticleLinks({ coverImage: url })).not.toBeNull()
  })

  it('treats absent, null and empty as "no cover"', () => {
    expect(validateArticleLinks({})).toBeNull()
    expect(validateArticleLinks({ coverImage: null })).toBeNull()
    expect(validateArticleLinks({ coverImage: '' })).toBeNull()
  })

  it('rejects an over-long URL and a non-string value', () => {
    expect(validateArticleLinks({ coverImage: `https://example.org/${'a'.repeat(2000)}.jpg` })).not.toBeNull()
    expect(validateArticleLinks({ coverImage: 42 })).not.toBeNull()
    expect(validateArticleLinks({ coverImage: { url: 'https://example.org/a.jpg' } })).not.toBeNull()
  })

  it('keeps whatever an older article already has when the author does not change it', () => {
    const current = { coverImage: 'http://old.example/legacy.jpg', reportUrl: null, pressReleaseUrl: null, visualUrl: null }
    expect(validateArticleLinks({ coverImage: current.coverImage }, current)).toBeNull()
    // …but a changed value is checked again
    expect(validateArticleLinks({ coverImage: 'http://old.example/other.jpg' }, current)).not.toBeNull()
  })
})

describe('CMS image field (validateValue)', () => {
  it.each(ACCEPTED_IMAGE_URLS)('accepts %s', (_label, url) => {
    expect(validateValue('image', url)).toBeNull()
  })

  it.each(REJECTED_IMAGE_URLS)('rejects %s', (_label, url) => {
    expect(validateValue('image', url)).not.toBeNull()
  })

  it('allows empty (means "use the built-in default") and rejects an over-long URL', () => {
    expect(validateValue('image', '')).toBeNull()
    expect(validateValue('image', `https://example.org/${'a'.repeat(2000)}.jpg`)).not.toBeNull()
  })
})

describe('CMS list item image (validateItemData)', () => {
  const item = (imageUrl: string) => ({ quote: { id: 'Halo', en: 'Hello' }, name: 'Parker G.', imageUrl })

  it.each(ACCEPTED_IMAGE_URLS)('accepts %s', (_label, url) => {
    expect(validateItemData(stories, item(url)).ok).toBe(true)
  })

  it.each(REJECTED_IMAGE_URLS)('rejects %s', (_label, url) => {
    expect(validateItemData(stories, item(url)).ok).toBe(false)
  })

  it('treats a missing image as optional', () => {
    expect(validateItemData(stories, item('')).ok).toBe(true)
  })
})

describe('shouldSkipImageOptimization', () => {
  it('keeps optimizing public/ files and our own uploads', () => {
    expect(shouldSkipImageOptimization('/news1.jpg')).toBe(false)
    expect(shouldSkipImageOptimization('/my photo (1).jpg')).toBe(false)
    expect(shouldSkipImageOptimization('https://media.indonesiatanpapolusi.org/articles/u/a.jpg')).toBe(false)
    expect(shouldSkipImageOptimization('https://indonesiatanpapolusi.org/site/admin_1/a.jpg')).toBe(false)
  })

  it.each(ACCEPTED_IMAGE_URLS.filter(([, url]) => url.startsWith('http') || url.startsWith('HTTP')))(
    'decides without throwing for %s',
    (_label, url) => {
      expect(typeof shouldSkipImageOptimization(url)).toBe('boolean')
    },
  )

  it('serves other sites, other buckets and our host outside the uploads folders as-is (the optimizer would refuse them)', () => {
    for (const url of [
      'https://images.unsplash.com/photo-123',
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://drive.google.com/uc?export=view&id=abc',
      'https://pub-0123456789abcdef.r2.dev/articles/u/a.jpg',
      'https://staging-media.example.org/articles/u/a.jpg',
      'https://media.indonesiatanpapolusi.org/other/a.jpg',
    ]) {
      expect(shouldSkipImageOptimization(url)).toBe(true)
    }
  })

  it('does not throw on empty or non-URL input', () => {
    expect(shouldSkipImageOptimization('')).toBe(false)
    expect(shouldSkipImageOptimization('not a url')).toBe(false)
  })
})

describe('isLocalImagePath', () => {
  it('is a single-slash path only', () => {
    expect(isLocalImagePath('/news1.jpg')).toBe(true)
    expect(isLocalImagePath('//evil.example/a.jpg')).toBe(false)
    expect(isLocalImagePath('/\\evil.example/a.jpg')).toBe(false)
    expect(isLocalImagePath('https://example.org/a.jpg')).toBe(false)
    expect(isLocalImagePath('news1.jpg')).toBe(false)
  })
})

describe('toCssUrl', () => {
  it('quotes the URL, so parentheses in real URLs stay inside the value', () => {
    expect(toCssUrl('https://upload.wikimedia.org/a/Smoke_(pollution).jpg')).toBe(
      'url("https://upload.wikimedia.org/a/Smoke_(pollution).jpg")',
    )
    expect(toCssUrl('/my photo (1).jpg')).toBe('url("/my photo (1).jpg")')
  })

  it('escapes quotes and backslashes so a URL cannot end the declaration and add CSS', () => {
    const css = toCssUrl('https://example.org/a.jpg");position:fixed;inset:0;background:url("https://example.org/b\\.jpg')
    expect(css.startsWith('url("')).toBe(true)
    expect(css.endsWith('")')).toBe(true)

    // Between the outer quotes, every quote and backslash must be escaped.
    const inner = css.slice('url("'.length, -'")'.length)
    expect(inner.replace(/\\./g, '')).not.toMatch(/["\\]/)
  })
})
