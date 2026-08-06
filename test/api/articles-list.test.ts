import { GET, POST } from '@/app/api/articles/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeArticle, makeUser, makeAccessToken, makeSuperAdminAccessToken } from '../fixtures'

describe('GET /api/articles', () => {
  it('returns the public paginated list of published, non-deleted articles', async () => {
    prismaMock.article.findMany.mockResolvedValue([makeArticle({ status: 'PUBLISHED' })])

    const res = await GET(makeRequest('/api/articles'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.items).toHaveLength(1)
    expect(body.nextCursor).toBeNull()
    expect(prismaMock.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PUBLISHED', deletedAt: null }),
      }),
    )
  })

  it('requires auth for ?mine=1', async () => {
    const res = await GET(makeRequest('/api/articles?mine=1'))
    expect(res.status).toBe(401)
  })

  it('returns only the caller\'s own articles for ?mine=1', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
    prismaMock.article.findMany.mockResolvedValue([makeArticle()])

    const res = await GET(makeRequest('/api/articles?mine=1', { token: 'raw-access-token' }))

    expect(res.status).toBe(200)
    expect(prismaMock.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { authorId: 'user_1' } }),
    )
  })

  it('requires super admin auth for ?all=1', async () => {
    const res = await GET(makeRequest('/api/articles?all=1', { token: 'not-an-admin-token' }))
    expect(res.status).toBe(401)
  })

  it('rejects an invalid ?status= value', async () => {
    const res = await GET(makeRequest('/api/articles?status=NOT_REAL'))
    expect(res.status).toBe(400)
  })

  it('requires super admin auth for ?status=', async () => {
    const res = await GET(makeRequest('/api/articles?status=PENDING_REVIEW'))
    expect(res.status).toBe(401)
  })

  it('returns articles filtered by status for an authenticated super admin', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findMany.mockResolvedValue([makeArticle({ status: 'PENDING_REVIEW' })])

    const res = await GET(
      makeRequest('/api/articles?status=PENDING_REVIEW', { token: 'raw-admin-token' }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
  })
})

describe('POST /api/articles', () => {
  it('requires auth', async () => {
    const res = await POST(makeRequest('/api/articles', { method: 'POST', body: {} }))
    expect(res.status).toBe(401)
  })

  it('blocks an unapproved journalist from creating a draft', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: null }))

    const res = await POST(
      makeRequest('/api/articles', {
        method: 'POST',
        token: 'raw-access-token',
        body: { sourceLocale: 'id', titleId: 'Judul' },
      }),
    )

    expect(res.status).toBe(403)
  })

  it('validates sourceLocale', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))

    const res = await POST(
      makeRequest('/api/articles', {
        method: 'POST',
        token: 'raw-access-token',
        body: { sourceLocale: 'fr', titleId: 'Judul' },
      }),
    )

    expect(res.status).toBe(400)
  })

  it('creates a DRAFT article for an approved journalist', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(null) // slug uniqueness check
    prismaMock.article.create.mockResolvedValue(
      makeArticle({ id: 'new_article', slug: 'judul-artikel', status: 'DRAFT' }),
    )

    const res = await POST(
      makeRequest('/api/articles', {
        method: 'POST',
        token: 'raw-access-token',
        body: { sourceLocale: 'id', titleId: 'Judul Artikel', excerptId: 'Ringkasan' },
      }),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('new_article')
    expect(body.status).toBe('DRAFT')
  })
})
