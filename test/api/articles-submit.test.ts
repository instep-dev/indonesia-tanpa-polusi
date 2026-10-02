import { POST as submit } from '@/app/api/articles/[id]/submit/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeArticle, makeUser, makeAccessToken } from '../fixtures'

// Submitting never translates and never touches the article's text: authors
// write or auto-translate both languages in the editor beforehand, and one
// language is enough to submit.
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
    prismaMock.article.update.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))

    const res = await call('article_1', 'raw-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('PENDING_REVIEW')
    // Only the status changes — in particular the other language is never rewritten or blanked.
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'article_1' }, data: { status: 'PENDING_REVIEW' } }),
    )
  })

  it('submits an article written in only one language, without touching the other', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', titleEn: '', excerptEn: '', contentEn: {} }),
    )
    prismaMock.article.update.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))

    const res = await call('article_1', 'raw-token')

    expect(res.status).toBe(200)
    const data = prismaMock.article.update.mock.calls[0][0].data
    expect(data).toEqual({ status: 'PENDING_REVIEW' })
  })

  it('accepts an English-only article too', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', sourceLocale: 'en', titleId: '', excerptId: '' }),
    )
    prismaMock.article.update.mockResolvedValue(makeArticle({ status: 'PENDING_REVIEW' }))

    expect((await call('article_1', 'raw-token')).status).toBe(200)
  })

  it('requires a title and an excerpt in at least one language', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))

    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', titleId: '', titleEn: '  ' }),
    )
    expect((await call('article_1', 'raw-token')).status).toBe(400)

    prismaMock.article.findUnique.mockResolvedValue(
      makeArticle({ authorId: 'user_1', status: 'DRAFT', excerptId: '', excerptEn: '' }),
    )
    expect((await call('article_1', 'raw-token')).status).toBe(400)
    expect(prismaMock.article.update).not.toHaveBeenCalled()
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
