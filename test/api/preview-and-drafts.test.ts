import { createHash } from 'crypto'
import { draftMode } from 'next/headers'
import { POST as createPreview } from '@/app/api/content-preview/route'
import { GET as enterPreview } from '@/app/api/preview/enter/route'
import { GET as exitPreview } from '@/app/api/preview/exit/route'
import { POST as saveDrafts, DELETE as discardDrafts } from '@/app/api/site-content/drafts/route'
import { GET as getContent, PUT as publish } from '@/app/api/site-content/route'
import { isPreviewPath } from '@/libs/previewPath'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeSuperAdmin, makeSuperAdminAccessToken } from '../fixtures'

jest.mock('next/headers', () => ({ draftMode: jest.fn() }))

const enable = jest.fn()
const disable = jest.fn()
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')

const asAdmin = () => {
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
  prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin({ name: 'Dewi Admin' }))
}

beforeEach(() => {
  enable.mockReset()
  disable.mockReset()
  jest.mocked(draftMode).mockResolvedValue({ isEnabled: false, enable, disable } as never)
})

describe('isPreviewPath', () => {
  it('accepts public pages only', () => {
    for (const ok of ['/en', '/id', '/en/sulawesi', '/id/news/some-article-1']) expect(isPreviewPath(ok)).toBe(true)
    for (const bad of ['/', '/fr/news', '//evil.example', 'https://evil.example', '/en/../super-admin', '/en/news?x=1', '/en/News', '/api/articles', '', 5, null]) {
      expect(isPreviewPath(bad)).toBe(false)
    }
  })
})

describe('POST /api/content-preview', () => {
  const call = (body: unknown, token?: string) =>
    createPreview(makeRequest('/api/content-preview', { method: 'POST', body, token }))

  it('requires super admin auth', async () => {
    expect((await call({ path: '/en' })).status).toBe(401)
    expect(prismaMock.contentPreviewToken.create).not.toHaveBeenCalled()
  })

  it('rejects paths that are not public pages', async () => {
    asAdmin()
    expect((await call({ path: '/super-admin/dashboard' }, 't')).status).toBe(400)
    expect((await call({ path: 'https://evil.example' }, 't')).status).toBe(400)
  })

  it('returns a single-use link, storing only the token\'s hash, valid for 10 minutes', async () => {
    asAdmin()
    const before = Date.now()
    const res = await call({ path: '/en/sulawesi' }, 't')
    expect(res.status).toBe(200)

    const { url } = await res.json()
    const token = new URL(url, 'http://localhost').searchParams.get('token') as string
    expect(url).toMatch(/^\/api\/preview\/enter\?token=[0-9a-f]{64}&path=%2Fen%2Fsulawesi$/)

    const stored = prismaMock.contentPreviewToken.create.mock.calls[0][0].data
    expect(stored.tokenHash).toBe(sha256(token)) // the raw token is never stored
    expect(JSON.stringify(stored)).not.toContain(token)
    expect(stored.superAdminId).toBe('admin_1')
    expect(stored.expiresAt.getTime() - before).toBeGreaterThan(9 * 60 * 1000)
    expect(stored.expiresAt.getTime() - before).toBeLessThanOrEqual(10 * 60 * 1000 + 1000)
    expect(prismaMock.contentPreviewToken.deleteMany).toHaveBeenCalled() // expired tokens are tidied up
  })
})

describe('GET /api/preview/enter', () => {
  const enter = (query: string) => enterPreview(makeRequest(`/api/preview/enter${query}`))
  const liveToken = () => ({ id: 'tok_1', tokenHash: sha256('abc'), superAdminId: 'admin_1', expiresAt: new Date(Date.now() + 60_000), createdAt: new Date() })

  it('turns on preview mode, burns the token and redirects to the page', async () => {
    prismaMock.contentPreviewToken.findUnique.mockResolvedValue(liveToken())

    const res = await enter('?token=abc&path=/en/sulawesi')

    expect(prismaMock.contentPreviewToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: sha256('abc') } })
    expect(prismaMock.contentPreviewToken.delete).toHaveBeenCalledWith({ where: { id: 'tok_1' } })
    expect(enable).toHaveBeenCalledTimes(1)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/en/sulawesi')
  })

  it('refuses unknown, expired or malformed links without enabling preview', async () => {
    prismaMock.contentPreviewToken.findUnique.mockResolvedValue(null)
    expect((await enter('?token=nope&path=/en')).status).toBe(401)

    prismaMock.contentPreviewToken.findUnique.mockResolvedValue({ ...liveToken(), expiresAt: new Date(Date.now() - 1000) })
    expect((await enter('?token=abc&path=/en')).status).toBe(401)

    expect((await enter('?path=/en')).status).toBe(400)
    expect((await enter('?token=abc&path=//evil.example')).status).toBe(400)
    expect((await enter('?token=abc&path=/api/users')).status).toBe(400)

    expect(enable).not.toHaveBeenCalled()
  })
})

describe('GET /api/preview/exit', () => {
  it('leaves preview mode and goes back to the page — or home for anything unsafe', async () => {
    const ok = await exitPreview(makeRequest('/api/preview/exit?path=/id/news'))
    expect(disable).toHaveBeenCalledTimes(1)
    expect(ok.headers.get('location')).toBe('http://localhost/id/news')

    const unsafe = await exitPreview(makeRequest('/api/preview/exit?path=//evil.example'))
    expect(unsafe.headers.get('location')).toBe('http://localhost/')
  })
})

describe('draft routes', () => {
  const post = (body: unknown, token?: string) => saveDrafts(makeRequest('/api/site-content/drafts', { method: 'POST', body, token }))
  const del = (body: unknown, token?: string) => discardDrafts(makeRequest('/api/site-content/drafts', { method: 'DELETE', body, token }))

  it('require super admin auth', async () => {
    expect((await post({ fields: [] })).status).toBe(401)
    expect((await del({ keys: [] })).status).toBe(401)
  })

  it('save drafts WITHOUT touching the live content, replacing any earlier draft', async () => {
    asAdmin()
    const res = await post(
      { fields: [{ key: 'marketing.home.hero.title', valueId: 'Draf', valueEn: 'Draft' }, { key: 'marketing.home.hero.subtitle', valueId: '', valueEn: '' }] },
      't',
    )

    expect(res.status).toBe(200)
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
    expect(prismaMock.siteContent.deleteMany).not.toHaveBeenCalled()
    expect(prismaMock.contentRevision.deleteMany).toHaveBeenCalledWith({
      where: { kind: 'field', status: 'DRAFT', targetKey: { in: ['marketing.home.hero.title', 'marketing.home.hero.subtitle'] } },
    })
    const rows = prismaMock.contentRevision.create.mock.calls.map(([args]) => args.data)
    expect(rows).toEqual([
      expect.objectContaining({ kind: 'field', status: 'DRAFT', action: 'SAVE', targetKey: 'marketing.home.hero.title', snapshot: { valueId: 'Draf', valueEn: 'Draft' }, createdByName: 'Dewi Admin' }),
      expect.objectContaining({ status: 'DRAFT', action: 'RESET', snapshot: { valueId: null, valueEn: null } }),
    ])
  })

  it('validate drafts exactly like publishing', async () => {
    asAdmin()
    expect((await post({ fields: [{ key: 'media.home.hero.video', valueId: 'http://insecure.example/a.mp4' }] }, 't')).status).toBe(400)
    expect((await post({ fields: [{ key: 'unknown.key', valueId: 'x' }] }, 't')).status).toBe(400)
    expect(prismaMock.contentRevision.create).not.toHaveBeenCalled()
  })

  it('discard only drafts of the named fields', async () => {
    asAdmin()
    prismaMock.contentRevision.deleteMany.mockResolvedValue({ count: 2 })
    const res = await del({ keys: ['marketing.home.hero.title'] }, 't')
    expect(await res.json()).toEqual({ ok: true, discarded: 2 })
    expect(prismaMock.contentRevision.deleteMany).toHaveBeenCalledWith({
      where: { kind: 'field', status: 'DRAFT', targetKey: { in: ['marketing.home.hero.title'] } },
    })
    expect((await del({ keys: ['not.a.field'] }, 't')).status).toBe(400)
  })
})

describe('publishing retires drafts', () => {
  const put = (body: unknown) => publish(makeRequest('/api/site-content', { method: 'PUT', body, token: 't' }))

  it('deletes the draft of every published field, plus any extra keys listed in clearDrafts', async () => {
    asAdmin()
    prismaMock.$transaction.mockResolvedValue([])
    await put({ fields: [{ key: 'marketing.home.hero.title', valueId: 'Judul', valueEn: 'Title' }], clearDrafts: ['marketing.home.hero.cta'] })

    expect(prismaMock.contentRevision.deleteMany).toHaveBeenCalledWith({
      where: { kind: 'field', status: 'DRAFT', targetKey: { in: ['marketing.home.hero.cta', 'marketing.home.hero.title'] } },
    })
    expect(prismaMock.siteContent.upsert).toHaveBeenCalled()
  })

  it('rejects bad clearDrafts keys', async () => {
    asAdmin()
    expect((await put({ fields: [{ key: 'marketing.home.hero.title', valueId: 'x', valueEn: 'x' }], clearDrafts: ['nope'] })).status).toBe(400)
  })
})

describe('GET /api/site-content — drafts', () => {
  it('returns each field\'s unpublished draft next to its live value', async () => {
    asAdmin()
    prismaMock.siteContent.findMany.mockResolvedValue([])
    prismaMock.contentRevision.findMany
      .mockResolvedValueOnce([]) // last-edited-by
      .mockResolvedValueOnce([
        { targetKey: 'marketing.home.hero.title', snapshot: { valueId: 'Draf', valueEn: 'Draft' } },
        { targetKey: 'marketing.home.hero.cta', snapshot: { garbage: true } },
      ] as never)

    const { fields } = await (await getContent(makeRequest('/api/site-content?page=home', { token: 't' }))).json()
    const byKey = (key: string) => fields.find((field: { key: string }) => field.key === key)

    expect(byKey('marketing.home.hero.title').draft).toEqual({ valueId: 'Draf', valueEn: 'Draft' })
    expect(byKey('marketing.home.hero.cta').draft).toBeNull() // a malformed draft is ignored, not a crash
    expect(byKey('marketing.home.hero.subtitle').draft).toBeNull()
  })
})
