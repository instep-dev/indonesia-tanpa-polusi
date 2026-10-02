import { getDictionary } from '@/i18n/getDictionary'
import { valueDefaults } from '@/data/content-registry'
import { getPageMetadata, getSiteDictionary, getSiteValues, getSocials, getStories } from '@/libs/siteContent'
import { prismaMock } from '../prisma-singleton'

describe('site content loader', () => {
  it('serves the built-in defaults when the tables are empty', async () => {
    prismaMock.siteContent.findMany.mockResolvedValue([])
    prismaMock.contentItem.findMany.mockResolvedValue([])

    expect(await getSiteDictionary('en')).toEqual(await getDictionary('en'))
    expect(await getSiteValues('id')).toEqual(valueDefaults)
    expect((await getStories('stories.home', 'en')).map((s) => s.name)).toEqual(['Parker G.', 'Charlie M.'])
    expect((await getSocials()).map((s) => s.handle)).toContain('@indonesiatanpapolusi')
  })

  it('applies stored overrides', async () => {
    prismaMock.siteContent.findMany.mockResolvedValue([
      { key: 'marketing.home.hero.title', valueId: 'Judul', valueEn: 'Custom title' },
      { key: 'media.home.hero.video', valueId: 'https://cdn.example.com/a.mp4', valueEn: null },
    ] as never)
    prismaMock.contentItem.findMany.mockResolvedValue([])

    expect((await getSiteDictionary('en')).marketing.home.hero.title).toBe('Custom title')
    expect((await getSiteValues('en'))['media.home.hero.video']).toBe('https://cdn.example.com/a.mp4')
  })

  it('never breaks the public site when the database is down', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    prismaMock.siteContent.findMany.mockRejectedValue(new Error('connection refused'))
    prismaMock.contentItem.findMany.mockRejectedValue(new Error('connection refused'))

    expect(await getSiteDictionary('en')).toEqual(await getDictionary('en'))
    expect(await getSiteValues('en')).toEqual(valueDefaults)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('builds page metadata from the SEO fields, adding OG only when an image is set', async () => {
    prismaMock.contentItem.findMany.mockResolvedValue([])
    prismaMock.siteContent.findMany.mockResolvedValue([
      { key: 'marketing.seo.home.title', valueId: null, valueEn: 'Home SEO' },
      { key: 'seo.home.ogImage', valueId: '/og.jpg', valueEn: null },
    ] as never)

    const home = await getPageMetadata('home', 'en')
    expect(home).toMatchObject({
      title: 'Home SEO',
      description: 'Indonesia Tanpa Polusi',
      alternates: {
        canonical: '/en',
        languages: { en: '/en', id: '/id', 'x-default': '/en' },
      },
      openGraph: {
        type: 'website',
        locale: 'en_US',
        title: 'Home SEO',
        url: '/en',
        images: ['/og.jpg'],
      },
    })

    // no share image configured → the card still has title/description, just no image
    const news = await getPageMetadata('news', 'id')
    expect(news).toMatchObject({
      title: 'Indonesia Tanpa Polusi',
      alternates: { canonical: '/id/news', languages: { en: '/en/news', id: '/id/news' } },
      openGraph: { locale: 'id_ID' },
    })
    expect(news.openGraph).not.toHaveProperty('images')
  })
})

describe('draft preview overlay', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const headers = require('next/headers') as typeof import('next/headers')
  const draft = { targetKey: 'marketing.home.hero.title', snapshot: { valueId: 'Judul DRAF', valueEn: 'DRAFT title' } }

  const stored = () => {
    prismaMock.siteContent.findMany.mockResolvedValue([
      { key: 'marketing.home.hero.title', valueId: 'Judul tayang', valueEn: 'Published title' },
    ] as never)
    prismaMock.contentItem.findMany.mockResolvedValue([])
    prismaMock.contentRevision.findMany.mockResolvedValue([draft] as never)
  }

  afterEach(() => jest.restoreAllMocks())

  it('visitors only ever see published content — drafts are not even queried', async () => {
    jest.spyOn(headers, 'draftMode').mockResolvedValue({ isEnabled: false } as never)
    stored()

    expect((await getSiteDictionary('en')).marketing.home.hero.title).toBe('Published title')
    expect(prismaMock.contentRevision.findMany).not.toHaveBeenCalled()
  })

  it('a previewing admin sees drafts on top of the published content', async () => {
    jest.spyOn(headers, 'draftMode').mockResolvedValue({ isEnabled: true } as never)
    stored()

    expect((await getSiteDictionary('en')).marketing.home.hero.title).toBe('DRAFT title')
    expect(prismaMock.contentRevision.findMany).toHaveBeenCalledWith({
      where: { kind: 'field', status: 'DRAFT' },
      select: { targetKey: true, snapshot: true },
    })
  })

  it('a draft that resets a field shows the built-in default in preview', async () => {
    jest.spyOn(headers, 'draftMode').mockResolvedValue({ isEnabled: true } as never)
    stored()
    prismaMock.contentRevision.findMany.mockResolvedValue([{ targetKey: draft.targetKey, snapshot: { valueId: null, valueEn: null } }] as never)

    expect((await getSiteDictionary('en')).marketing.home.hero.title).toBe('Stop Captive Coal-Fired Power Plants.')
  })
})
