import { POST as review } from '@/app/api/articles/[id]/review/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeArticle, makeSuperAdminAccessToken } from '../fixtures'

const call = (id: string, body: unknown, token?: string) =>
  review(makeRequest(`/api/articles/${id}/review`, { method: 'POST', body, token }), params({ id }))

describe('POST /api/articles/[id]/review', () => {
  it('requires super admin auth', async () => {
    const res = await call('article_1', { action: 'approve' })
    expect(res.status).toBe(401)
  })

  it('publishes a PENDING_REVIEW article on approve', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))
    prismaMock.article.update.mockResolvedValue(
      makeArticle({ status: 'PUBLISHED', publishedAt: new Date() }),
    )

    const res = await call('article_1', { action: 'approve' }, 'raw-admin-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('PUBLISHED')
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PUBLISHED', reviewedById: 'admin_1' }),
      }),
    )
  })

  it('rejects a PENDING_REVIEW article with a reason', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))
    prismaMock.article.update.mockResolvedValue(
      makeArticle({ status: 'REJECTED', rejectionReason: 'Needs more sources' }),
    )

    const res = await call(
      'article_1',
      { action: 'reject', rejectionReason: 'Needs more sources' },
      'raw-admin-token',
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('REJECTED')
    expect(body.rejectionReason).toBe('Needs more sources')
  })

  it('returns 404 for a non-existent article', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(null)

    const res = await call('missing', { action: 'approve' }, 'raw-admin-token')
    expect(res.status).toBe(404)
  })

  it('returns 409 for an already-deleted article', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ status: 'PENDING_REVIEW', deletedAt: new Date() }),
    )

    const res = await call('article_1', { action: 'approve' }, 'raw-admin-token')
    expect(res.status).toBe(409)
  })

  it('returns 409 when the article is not PENDING_REVIEW', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'DRAFT' }))

    const res = await call('article_1', { action: 'approve' }, 'raw-admin-token')
    expect(res.status).toBe(409)
  })

  it('returns 400 for an invalid action', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))

    const res = await call('article_1', { action: 'delete-it' }, 'raw-admin-token')
    expect(res.status).toBe(400)
  })
})
