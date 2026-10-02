import { buildArticleMetadata } from '@/libs/articleMetadata'
import { buildAlternates } from '@/libs/siteUrl'

const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

const base = {
  slug: 'pltu-captive',
  coverImage: 'https://media.indonesiatanpapolusi.org/articles/u/cover.jpg',
  publishedAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-02T00:00:00.000Z',
}
const both = { ...base, titleId: 'Judul', titleEn: 'Title', excerptId: 'Ringkasan', excerptEn: 'Summary', contentId: doc('Isi'), contentEn: doc('Body') }
const indonesianOnly = { ...both, titleEn: '', excerptEn: '', contentEn: {} }

describe('buildAlternates', () => {
  it('canonical points at the page itself, with hreflang for every language', () => {
    expect(buildAlternates('/news', 'id')).toEqual({
      canonical: '/id/news',
      languages: { en: '/en/news', id: '/id/news', 'x-default': '/en/news' },
    })
  })

  it('lists only the languages that exist and canonicalises a missing one to a real one', () => {
    expect(buildAlternates('/news/x', 'en', ['id'])).toEqual({
      canonical: '/id/news/x',
      languages: { id: '/id/news/x', 'x-default': '/id/news/x' },
    })
  })
})

describe('buildArticleMetadata', () => {
  it('builds title, description, canonical, hreflang and a large share card for a bilingual article', () => {
    const meta = buildArticleMetadata(both, 'en')

    expect(meta.title).toBe('Title | Indonesia Tanpa Polusi')
    expect(meta.description).toBe('Summary')
    expect(meta.alternates).toEqual({
      canonical: '/en/news/pltu-captive',
      languages: { en: '/en/news/pltu-captive', id: '/id/news/pltu-captive', 'x-default': '/en/news/pltu-captive' },
    })
    expect(meta.robots).toBeUndefined()
    expect(meta.openGraph).toMatchObject({
      type: 'article',
      locale: 'en_US',
      title: 'Title',
      publishedTime: '2026-09-01T00:00:00.000Z',
      images: [{ url: base.coverImage }],
    })
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image', images: [base.coverImage] })
  })

  it('uses the Indonesian text everywhere on /id', () => {
    const meta = buildArticleMetadata(both, 'id')
    expect(meta.title).toBe('Judul | Indonesia Tanpa Polusi')
    expect(meta.description).toBe('Ringkasan')
    expect(meta.openGraph).toMatchObject({ locale: 'id_ID' })
  })

  it('an Indonesian-only article on /en: falls back to the text, is noindex, and canonicalises to /id', () => {
    const meta = buildArticleMetadata(indonesianOnly, 'en')

    expect(meta.title).toBe('Judul | Indonesia Tanpa Polusi')
    expect(meta.description).toBe('Ringkasan')
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect(meta.alternates).toEqual({
      canonical: '/id/news/pltu-captive',
      languages: { id: '/id/news/pltu-captive', 'x-default': '/id/news/pltu-captive' }, // no /en alternate
    })
    // ...while the real Indonesian page is a normal indexable page
    expect(buildArticleMetadata(indonesianOnly, 'id').robots).toBeUndefined()
  })

  it('without a cover image the share card is a plain summary', () => {
    const meta = buildArticleMetadata({ ...both, coverImage: null }, 'en')
    expect(meta.twitter).toMatchObject({ card: 'summary' })
    expect(meta.openGraph).not.toHaveProperty('images')
  })

  it('shortens very long descriptions', () => {
    const meta = buildArticleMetadata({ ...both, excerptEn: 'word '.repeat(100) }, 'en')
    expect(String(meta.description).length).toBeLessThanOrEqual(200)
    expect(String(meta.description).endsWith('…')).toBe(true)
  })
})
