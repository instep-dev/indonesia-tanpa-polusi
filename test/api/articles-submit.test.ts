import { POST as submit } from '@/app/api/articles/[id]/submit/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeArticle, makeUser, makeAccessToken } from '../fixtures'

// No TRANSLATE_API_URL is configured in the test environment, so
// libs/translate.ts deterministically reports every field as untranslatable
// -> translationStatus ends up 'FAILED'. That's the expected, exercised path
// here (a reviewer fills in the missing language manually).
const call = (id: string, token?: string) =>
  submit(makeRequest(`/api/articles/${id}/submit`, { method: 'POST', token }), params({ id }))

describe('POST /api/articles/[id]/submit', () => {
  it('requires auth', async () => {
    const res = await call('article_1')
    expect(res.status).toBe(401)
  })

  it('blocks an unapproved journalist', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: null }))

    const res = await call('article_1', 'raw-token')
    expect(res.status).toBe(403)
  })

  it('moves a DRAFT to PENDING_REVIEW', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', sourceLocale: 'id' }),
    )
    prismaMock.article.update.mockResolvedValue(
      makeArticle({ status: 'PENDING_REVIEW', translationStatus: 'FAILED' }),
    )

    const res = await call('article_1', 'raw-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('PENDING_REVIEW')
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING_REVIEW' }) }),
    )
  })

  it('requires a title and excerpt before submitting', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', sourceLocale: 'id', titleId: '' }),
    )

    const res = await call('article_1', 'raw-token')
    expect(res.status).toBe(400)
  })

  it('forbids submitting someone else\'s article', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'someone_else' }))

    const res = await call('article_1', 'raw-token')
    expect(res.status).toBe(403)
  })

  it('refuses to re-submit an article that already left DRAFT', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'PENDING_REVIEW' }),
    )

    const res = await call('article_1', 'raw-token')
    expect(res.status).toBe(409)
  })
})
