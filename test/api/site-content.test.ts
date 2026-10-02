import { GET, PUT } from '@/app/api/site-content/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeSuperAdmin, makeSuperAdminAccessToken } from '../fixtures'

const asAdmin = () => {
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
  prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin({ name: 'Dewi Admin' }))
}

const put = (body: unknown, token?: string) =>
  PUT(makeRequest('/api/site-content', { method: 'PUT', body, token }))

describe('GET /api/site-content', () => {
  it('requires super admin auth', async () => {
    const res = await GET(makeRequest('/api/site-content?page=home'))
    expect(res.status).toBe(401)
  })

  it('rejects a journalist token', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
    const res = await GET(makeRequest('/api/site-content?page=home', { token: 'journalist-token' }))
    expect(res.status).toBe(401)
  })

  it('returns 404 for an unknown page', async () => {
    asAdmin()
    const res = await GET(makeRequest('/api/site-content?page=nope', { token: 't' }))
    expect(res.status).toBe(404)
  })

  it('returns stored overrides next to built-in defaults', async () => {
    asAdmin()
    prismaMock.siteContent.findMany.mockResolvedValue([
      { id: 'c1', key: 'marketing.home.hero.title', valueId: null, valueEn: 'Custom', updatedById: null, updatedAt: new Date() },
    ])

    const res = await GET(makeRequest('/api/site-content?page=home', { token: 't' }))
    expect(res.status).toBe(200)

    const { fields } = await res.json()
    const title = fields.find((f: { key: string }) => f.key === 'marketing.home.hero.title')
    expect(title).toMatchObject({ valueEn: 'Custom', valueId: null, defaultEn: 'Stop Captive Coal-Fired Power Plants.' })
    expect(title.lastEdit).toBeNull()
    const video = fields.find((f: { key: string }) => f.key === 'media.home.hero.video')
    expect(video).toMatchObject({ valueId: null, defaultId: '/heros.compressed.mp4' })
  })
})

describe('GET /api/site-content — last edited by', () => {
  it('reports who changed a field last and when', async () => {
    asAdmin()
    prismaMock.siteContent.findMany.mockResolvedValue([])
    prismaMock.contentRevision.findMany.mockResolvedValue([
      { targetKey: 'marketing.home.hero.title', createdByName: 'Dewi Admin', createdAt: new Date('2026-10-01T10:00:00.000Z') },
    ] as never)

    const { fields } = await (await GET(makeRequest('/api/site-content?page=home', { token: 't' }))).json()
    const title = fields.find((f: { key: string }) => f.key === 'marketing.home.hero.title')
    expect(title.lastEdit).toEqual({ by: 'Dewi Admin', at: '2026-10-01T10:00:00.000Z' })
    // newest revision per field only
    expect(prismaMock.contentRevision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ distinct: ['targetKey'], orderBy: { createdAt: 'desc' } }),
    )
  })
})

describe('PUT /api/site-content', () => {
  it('requires super admin auth', async () => {
    const res = await put({ fields: [{ key: 'marketing.home.hero.title', valueId: 'x', valueEn: 'x' }] })
    expect(res.status).toBe(401)
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
  })

  it('rejects keys that are not in the registry', async () => {
    asAdmin()
    const res = await put({ fields: [{ key: 'marketing.nav.__proto__', valueId: 'x', valueEn: 'x' }] }, 't')
    expect(res.status).toBe(400)
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
  })

  it('rejects invalid values (non-https video, foreign image, javascript: link)', async () => {
    asAdmin()
    for (const field of [
      { key: 'media.home.hero.video', valueId: 'http://cdn.example.com/a.mp4', valueEn: '' },
      { key: 'media.home.about.image', valueId: 'https://evil.example/x.jpg', valueEn: '' },
      { key: 'media.home.hero.ctaHref', valueId: 'javascript:alert(1)', valueEn: '' },
    ]) {
      const res = await put({ fields: [field] }, 't')
      expect(res.status).toBe(400)
    }
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
  })

  it('rejects malformed bodies', async () => {
    asAdmin()
    expect((await put({}, 't')).status).toBe(400)
    expect((await put({ fields: [] }, 't')).status).toBe(400)
    expect((await put({ fields: [{ valueId: 'x' }] }, 't')).status).toBe(400)
  })

  it('upserts filled fields and resets empty ones, recording who edited', async () => {
    asAdmin()
    prismaMock.$transaction.mockResolvedValue([])

    const res = await put(
      {
        fields: [
          { key: 'marketing.home.hero.title', valueId: ' Judul ', valueEn: 'Title' },
          { key: 'marketing.home.hero.subtitle', valueId: '', valueEn: '' },
          { key: 'media.home.hero.video', valueId: 'https://cdn.example.com/a.mp4', valueEn: 'ignored (not localized)' },
        ],
      },
      't',
    )

    expect(res.status).toBe(200)
    expect(prismaMock.siteContent.upsert).toHaveBeenCalledWith({
      where: { key: 'marketing.home.hero.title' },
      create: { key: 'marketing.home.hero.title', valueId: 'Judul', valueEn: 'Title', updatedById: 'admin_1' },
      update: { valueId: 'Judul', valueEn: 'Title', updatedById: 'admin_1' },
    })
    expect(prismaMock.siteContent.deleteMany).toHaveBeenCalledWith({ where: { key: 'marketing.home.hero.subtitle' } })

    // every saved field leaves a history entry (state after the change), written by the same transaction
    const revisions = prismaMock.contentRevision.create.mock.calls.map(([args]) => args.data)
    expect(revisions).toEqual([
      expect.objectContaining({ kind: 'field', targetKey: 'marketing.home.hero.title', action: 'SAVE', snapshot: { valueId: 'Judul', valueEn: 'Title' }, createdByName: 'Dewi Admin' }),
      expect.objectContaining({ kind: 'field', targetKey: 'marketing.home.hero.subtitle', action: 'RESET', snapshot: { valueId: null, valueEn: null } }),
      expect.objectContaining({ kind: 'field', targetKey: 'media.home.hero.video', action: 'SAVE', snapshot: { valueId: 'https://cdn.example.com/a.mp4', valueEn: null } }),
    ])
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
    expect(prismaMock.siteContent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: 'media.home.hero.video' },
        create: expect.objectContaining({ valueId: 'https://cdn.example.com/a.mp4', valueEn: null }),
      }),
    )
  })
})
