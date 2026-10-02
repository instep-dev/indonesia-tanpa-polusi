import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { prismaMock } from '../prisma-singleton'

const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })
const site = 'https://indonesiatanpapolusi.org'

const article = (overrides: Record<string, unknown> = {}) => ({
  slug: 'both',
  updatedAt: new Date('2026-09-02T00:00:00.000Z'),
  titleId: 'Judul',
  titleEn: 'Title',
  contentId: doc('Isi'),
  contentEn: doc('Body'),
  ...overrides,
})

describe('sitemap', () => {
  it('lists every static page in both languages with hreflang alternates', async () => {
    prismaMock.article.findMany.mockResolvedValue([])
    const entries = await sitemap()

    expect(entries).toHaveLength(10) // 5 pages × 2 languages
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([`${site}/en`, `${site}/id`, `${site}/en/sulawesi`, `${site}/id/news`]),
    )
    const home = entries.find((entry) => entry.url === `${site}/en`)
    expect(home?.alternates?.languages).toEqual({ en: `${site}/en`, id: `${site}/id` })
  })

  it('lists a bilingual article in both languages, and a one-language article only in its language', async () => {
    prismaMock.article.findMany.mockResolvedValue([
      article(),
      article({ slug: 'id-only', titleEn: '', contentEn: {} }),
    ] as never)
    const urls = (await sitemap()).map((entry) => entry.url)

    expect(urls).toEqual(expect.arrayContaining([`${site}/en/news/both`, `${site}/id/news/both`, `${site}/id/news/id-only`]))
    expect(urls).not.toContain(`${site}/en/news/id-only`)
  })

  it('gives articles a lastModified and only same-article alternates', async () => {
    prismaMock.article.findMany.mockResolvedValue([article({ slug: 'id-only', titleEn: '', contentEn: {} })] as never)
    const entry = (await sitemap()).find((item) => item.url === `${site}/id/news/id-only`)

    expect(entry?.lastModified).toEqual(new Date('2026-09-02T00:00:00.000Z'))
    expect(entry?.alternates?.languages).toEqual({ id: `${site}/id/news/id-only` })
  })

  it('only asks for published, non-deleted articles', async () => {
    prismaMock.article.findMany.mockResolvedValue([])
    await sitemap()
    expect(prismaMock.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED', deletedAt: null } }),
    )
  })

  it('still serves the static pages when the database is down', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    prismaMock.article.findMany.mockRejectedValue(new Error('connection refused'))

    expect(await sitemap()).toHaveLength(10)
    consoleError.mockRestore()
  })
})

describe('robots', () => {
  it('keeps crawlers out of the API and the admin/login areas, and points at the sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/super-admin', '/auth'] },
      sitemap: `${site}/sitemap.xml`,
    })
  })
})
