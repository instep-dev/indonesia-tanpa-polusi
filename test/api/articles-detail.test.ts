import { GET, PATCH, DELETE } from '@/app/api/articles/[id]/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeArticle, makeUser, makeAccessToken, makeSuperAdminAccessToken } from '../fixtures'

const getArticle = (id: string, token?: string) =>
  GET(makeRequest(`/api/articles/${id}`, { token }), params({ id }))

describe('GET /api/articles/[id]', () => {
  it('returns a published article to anonymous visitors', async () => {
    prismaMock.article.findFirst.mockResolvedValue(makeArticle({ status: 'PUBLISHED' }))

    const res = await getArticle('article_1')
    expect(res.status).toBe(200)
  })

  it('hides a draft from anonymous visitors (404)', async () => {
    prismaMock.article.findFirst.mockResolvedValue(makeArticle({ status: 'DRAFT' }))

    const res = await getArticle('article_1')
    expect(res.status).toBe(404)
  })

  it('lets the author view their own draft', async () => {
    prismaMock.article.findFirst.mockResolvedValue(makeArticle({ status: 'DRAFT', authorId: 'user_1' }))
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))

    const res = await getArticle('article_1', 'raw-token')
    expect(res.status).toBe(200)
  })

  it('hides a soft-deleted article from the public, even the author', async () => {
    prismaMock.article.findFirst.mockResolvedValue(
      makeArticle({ status: 'PUBLISHED', deletedAt: new Date(), authorId: 'user_1' }),
    )
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))

    const res = await getArticle('article_1', 'raw-token')
    expect(res.status).toBe(404)
  })

  it('lets a super admin view a soft-deleted article (audit trail)', async () => {
    prismaMock.article.findFirst.mockResolvedValue(makeArticle({ deletedAt: new Date() }))
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())

    const res = await getArticle('article_1', 'raw-admin-token')
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/articles/[id]', () => {
  const patch = (id: string, body: unknown, token?: string) =>
    PATCH(makeRequest(`/api/articles/${id}`, { method: 'PATCH', body, token }), params({ id }))

  it('requires auth', async () => {
    const res = await patch('article_1', { titleId: 'New title' })
    expect(res.status).toBe(401)
  })

  it('forbids editing someone else\'s article', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'someone_else' }))

    const res = await patch('article_1', { titleId: 'Hijacked' }, 'raw-token')
    expect(res.status).toBe(403)
  })

  it('resets a REJECTED article back to DRAFT on edit', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'REJECTED', rejectionReason: 'Fix typos' }),
    )
    prismaMock.article.update.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', rejectionReason: null }),
    )

    const res = await patch('article_1', { titleId: 'Fixed title' }, 'raw-token')

    expect(res.status).toBe(200)
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT', rejectionReason: null }),
      }),
    )
  })

  it('refuses to edit a PUBLISHED article', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'PUBLISHED' }),
    )

    const res = await patch('article_1', { titleId: 'x' }, 'raw-token')
    expect(res.status).toBe(409)
  })
})

describe('DELETE /api/articles/[id]', () => {
  const del = (id: string, token?: string) =>
    DELETE(makeRequest(`/api/articles/${id}`, { method: 'DELETE', token }), params({ id }))

  it('lets the journalist hard-delete their own DRAFT', async () => {
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'DRAFT' }))
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.article.delete.mockResolvedValue(makeArticle())

    const res = await del('article_1', 'raw-token')
    expect(res.status).toBe(200)
    expect(prismaMock.article.delete).toHaveBeenCalledWith({ where: { id: 'article_1' } })
  })

  it('refuses to let a journalist delete a non-DRAFT article', async () => {
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'PUBLISHED' }),
    )
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))

    const res = await del('article_1', 'raw-token')
    expect(res.status).toBe(409)
  })

  it('lets a super admin soft-delete any article', async () => {
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED' }))
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.update.mockResolvedValue(makeArticle({ deletedAt: new Date() }))

    const res = await del('article_1', 'raw-admin-token')
    expect(res.status).toBe(200)
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deletedAt: expect.any(Date) }) }),
    )
  })

  it('refuses to soft-delete an already-deleted article', async () => {
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ deletedAt: new Date() }))
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())

    const res = await del('article_1', 'raw-admin-token')
    expect(res.status).toBe(409)
  })

  it('returns 401 for a completely unauthenticated caller', async () => {
    prismaMock.article.findUnique.mockResolvedValue(makeArticle())
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)

    const res = await del('article_1')
    expect(res.status).toBe(401)
  })

  it('returns 404 for a non-existent article', async () => {
    prismaMock.article.findUnique.mockResolvedValue(null)

    const res = await del('missing', 'raw-token')
    expect(res.status).toBe(404)
  })
})
