/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import AboutRegion from '@/components/marketing/AboutRegion'
import AboutUs from '@/components/reusable/AboutUs'
import HeroRegion from '@/components/marketing/HeroRegion'
import OurStories from '@/components/reusable/OurStories'
import LatestNews from '@/components/marketing/LatestNews'
import { shouldSkipImageOptimization } from '@/libs/imageHosts'
import type { ArticleDto } from '@/services/article/article.dto'
import { ACCEPTED_IMAGE_URLS } from '../image-urls'

// Renders the REAL components inside the REAL installed next/image. The optimizer only
// knows the hosts in next.config.ts, so an image from anywhere else must be rendered
// `unoptimized` (served as-is) — otherwise next/image throws in dev and the optimizer
// answers 400 in production, i.e. a broken image.

// Every accepted URL that the optimizer cannot handle: other sites, other buckets, …
const NEEDS_UNOPTIMIZED = ACCEPTED_IMAGE_URLS.filter(([, url]) => shouldSkipImageOptimization(url))
const LOCAL = ACCEPTED_IMAGE_URLS.filter(([, url]) => url.startsWith('/'))

const heroDict = { hero: { title: 'Title', subtitle: 'Subtitle' } } as never
const aboutDict = { label: 'About', title: 'About us', body: ['Body'], cta: 'More' } as never
const storiesDict = { heading: 'Stories', body: 'Body' }
const newsDict = { heading: 'News', viewAllCta: 'All', intro: 'Intro', generalLabel: 'General', readMore: 'Read' } as never

const article = (coverImage: string | null): ArticleDto =>
  ({
    id: 'a1',
    slug: 'an-article',
    titleId: 'Judul',
    titleEn: 'Title',
    excerptId: 'Ringkasan',
    excerptEn: 'Summary',
    sourceLocale: 'en',
    coverImage,
    region: null,
    images: [],
    publishedAt: '2026-09-01T00:00:00.000Z',
  }) as unknown as ArticleDto

const renderers: Array<[string, (src: string) => ReturnType<typeof render>]> = [
  ['AboutRegion', (src) => render(<AboutRegion dict={{ heading: 'H', body: ['b'] }} image={src} />)],
  ['AboutUs', (src) => render(<AboutUs dict={aboutDict} image={src} ctaHref="#" />)],
  ['HeroRegion', (src) => render(<HeroRegion dict={heroDict} image={src} />)],
  [
    'OurStories',
    (src) => render(<OurStories dict={storiesDict} cards={[{ id: 's1', name: 'N', quote: 'Q', imageUrl: src }]} />),
  ],
  [
    'LatestNews (article cover)',
    (src) => render(<LatestNews currentLocale="en" dict={newsDict} articles={[article(src)]} fallbackCover="/news1.jpg" />),
  ],
]

describe('external images render as-is instead of through the optimizer', () => {
  describe.each(renderers)('%s', (_name, renderWith) => {
    it.each(NEEDS_UNOPTIMIZED)('shows %s untouched', (_label, url) => {
      const { container } = renderWith(url)
      const img = container.querySelector('img')

      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toBe(url)
      expect(img?.getAttribute('srcset')).toBeNull()
    })

    it.each(LOCAL)('still optimizes %s', (_label, path) => {
      const { container } = renderWith(path)
      const src = container.querySelector('img')?.getAttribute('src') ?? ''

      expect(src).toContain('/_next/image')
      expect(src).toContain(encodeURIComponent(path))
    })
  })

  it('LatestNews falls back to the fallback cover when an article has none', () => {
    const { container } = render(<LatestNews currentLocale="en" dict={newsDict} articles={[article(null)]} fallbackCover="/news1.jpg" />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain(encodeURIComponent('/news1.jpg'))
  })

  it('LatestNews can fall back to an external fallback cover as well', () => {
    const url = 'https://images.unsplash.com/photo-123?w=1200'
    const { container } = render(<LatestNews currentLocale="en" dict={newsDict} articles={[article(null)]} fallbackCover={url} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(url)
  })

  // (Why this is needed — the optimizer answering 400 for a host missing from
  // next.config.ts — only shows with the app's real image config, so it is covered by
  // the live smoke test, not here: jest has no images config for next/image to check.)
})
