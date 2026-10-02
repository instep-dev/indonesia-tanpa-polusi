import { POST } from '@/app/api/translate/route'
import { isTranslationConfigured, translateDocument, translatePlainText, translatePlainTexts } from '@/libs/translate'
import { resetRateLimits } from '@/libs/rateLimit'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeAccessToken, makeSuperAdminAccessToken, makeUser } from '../fixtures'

jest.mock('@/libs/translate', () => ({
  isTranslationConfigured: jest.fn(),
  translatePlainText: jest.fn(),
  translatePlainTexts: jest.fn(),
  translateDocument: jest.fn(),
}))

const call = (body: unknown, token?: string) =>
  POST(makeRequest('/api/translate', { method: 'POST', body, token }))

const asJournalist = (approved = true) => {
  prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
  prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: approved ? new Date() : null }))
}
const asAdmin = () => {
  prismaMock.accessToken.findUnique.mockResolvedValue(null)
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
}

const paragraphs = (count: number) => ({
  type: 'doc',
  content: Array.from({ length: count }, (_, i) => ({ type: 'paragraph', content: [{ type: 'text', text: `Paragraf ${i}` }] })),
})

beforeEach(() => {
  resetRateLimits()
  jest.mocked(isTranslationConfigured).mockReturnValue(true)
  jest.mocked(translatePlainText).mockReset()
  jest.mocked(translatePlainTexts).mockReset()
  jest.mocked(translateDocument).mockReset()
})

describe('POST /api/translate — access', () => {
  it('requires a token', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
    expect((await call({ from: 'id', text: 'Halo' })).status).toBe(401)
  })

  it('blocks an unapproved journalist', async () => {
    asJournalist(false)
    expect((await call({ from: 'id', text: 'Halo' }, 't')).status).toBe(403)
    expect(translatePlainText).not.toHaveBeenCalled()
  })

  it('serves an approved journalist and a super admin', async () => {
    jest.mocked(translatePlainText).mockResolvedValue({ ok: true, text: 'Hello' })

    asJournalist()
    const journalist = await call({ from: 'id', text: 'Halo' }, 't')
    expect(journalist.status).toBe(200)
    expect(await journalist.json()).toEqual({ text: 'Hello' })

    asAdmin()
    expect((await call({ from: 'id', text: 'Halo' }, 't')).status).toBe(200)
    expect(translatePlainText).toHaveBeenCalledWith('Halo', 'id')
  })
})

describe('POST /api/translate — validation and limits', () => {
  beforeEach(asAdmin)

  it('validates the request shape', async () => {
    expect((await call({ from: 'fr', text: 'x' }, 't')).status).toBe(400)
    expect((await call({ from: 'id' }, 't')).status).toBe(400)
    expect((await call({ from: 'id', text: 'x', content: {} }, 't')).status).toBe(400)
    expect((await call({ from: 'id', text: 'x', texts: ['y'] }, 't')).status).toBe(400)
    expect((await call({ from: 'id', texts: [] }, 't')).status).toBe(400)
    expect((await call({ from: 'id', texts: ['ok', 5] }, 't')).status).toBe(400)
    expect((await call({ from: 'id', text: 42 }, 't')).status).toBe(400)
    expect((await call('nope', 't')).status).toBe(400)
  })

  it('caps text and document size', async () => {
    expect((await call({ from: 'id', text: 'x'.repeat(4001) }, 't')).status).toBe(400)
    expect((await call({ from: 'id', content: paragraphs(201) }, 't')).status).toBe(400)
    expect(translatePlainText).not.toHaveBeenCalled()
    expect(translateDocument).not.toHaveBeenCalled()
  })

  it('answers 503 with a clear message when auto-translation is not configured', async () => {
    jest.mocked(isTranslationConfigured).mockReturnValue(false)
    const res = await call({ from: 'id', text: 'Halo' }, 't')
    expect(res.status).toBe(503)
    expect((await res.json()).error).toMatch(/not available/i)
  })

  it('answers 502 when the translation service fails', async () => {
    jest.mocked(translatePlainText).mockResolvedValue({ ok: false, reason: 'failed' })
    expect((await call({ from: 'id', text: 'Halo' }, 't')).status).toBe(502)
  })

  it('rate-limits one account (30 requests a minute)', async () => {
    jest.mocked(translatePlainText).mockResolvedValue({ ok: true, text: 'Hi' })
    for (let i = 0; i < 30; i++) expect((await call({ from: 'id', text: 'Halo' }, 't')).status).toBe(200)
    expect((await call({ from: 'id', text: 'Halo' }, 't')).status).toBe(429)
  })
})

describe('POST /api/translate — several texts (multi-paragraph copy)', () => {
  beforeEach(asAdmin)

  it('translates a batch in one go and keeps their order', async () => {
    jest.mocked(translatePlainTexts).mockResolvedValue({ ok: true, texts: ['One', '', 'Three'] })
    const res = await call({ from: 'id', texts: ['Satu', '', 'Tiga'] }, 't')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ texts: ['One', '', 'Three'] })
    expect(translatePlainTexts).toHaveBeenCalledWith(['Satu', '', 'Tiga'], 'id')
  })

  it('caps the number of texts and their total size', async () => {
    expect((await call({ from: 'id', texts: Array.from({ length: 51 }, () => 'x') }, 't')).status).toBe(400)
    expect((await call({ from: 'id', texts: ['x'.repeat(6000), 'y'.repeat(6001)] }, 't')).status).toBe(400)
    expect(translatePlainTexts).not.toHaveBeenCalled()
  })

  it('answers 502 when the service fails', async () => {
    jest.mocked(translatePlainTexts).mockResolvedValue({ ok: false, reason: 'failed' })
    expect((await call({ from: 'id', texts: ['Halo'] }, 't')).status).toBe(502)
  })
})

describe('POST /api/translate — documents', () => {
  it('returns the translated document with the failed-block count', async () => {
    asAdmin()
    jest.mocked(translateDocument).mockResolvedValue({ ok: true, content: { type: 'doc', content: [] }, totalBlocks: 3, failedBlocks: 1 })
    const res = await call({ from: 'en', content: paragraphs(3) }, 't')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ content: { type: 'doc', content: [] }, totalBlocks: 3, failedBlocks: 1 })
    expect(translateDocument).toHaveBeenCalledWith(expect.anything(), 'en')
  })
})
