import { PATCH } from '@/app/api/articles/[id]/route'
import { POST as addImage } from '@/app/api/articles/[id]/images/route'
import { DELETE as removeImage } from '@/app/api/articles/[id]/images/[imageId]/route'
import { POST as create } from '@/app/api/articles/route'
import { POST as submit } from '@/app/api/articles/[id]/submit/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeAccessToken, makeArticle, makeSuperAdminAccessToken, makeUser } from '../fixtures'
import { ACCEPTED_IMAGE_URLS, REJECTED_IMAGE_URLS } from '../image-urls'

// Super-admin "fix mode": edit any article (e.g. correct or fill in a translation),
// without becoming its author or changing where it is in the review flow.

const asSuperAdmin = () => {
  prismaMock.accessToken.findUnique.mockResolvedValue(null)
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
}
const asJournalist = () => {
  prismaMock.accessToken.findUnique.mockResolvedValue(makeAccessToken({ userId: 'user_1' }))
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
  prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
}

const patch = (body: unknown, token = 't') =>
  PATCH(makeRequest('/api/articles/article_1', { method: 'PATCH', body, token }), params({ id: 'article_1' }))

const translation = { titleEn: 'Fixed English title', excerptEn: 'Fixed summary', contentEn: { type: 'doc', content: [] } }

describe('PATCH /api/articles/[id] — super admin', () => {
  it.each(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'])('can fix a %s article that someone else wrote', async (status) => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status, authorId: 'someone_else' }))
    prismaMock.article.update.mockResolvedValue(makeArticle({ status }))

    const res = await patch(translation)

    expect(res.status).toBe(200)
    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'article_1' }, data: translation }),
    )
  })

  it('never changes the status, the author or the rejection reason — even for a REJECTED article', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'REJECTED', rejectionReason: 'Needs sources' }))
    prismaMock.article.update.mockResolvedValue(makeArticle({ status: 'REJECTED' }))

    await patch({ ...translation, status: 'PUBLISHED', authorId: 'attacker', rejectionReason: null } as never)

    const data = prismaMock.article.update.mock.calls[0][0].data
    expect(data).toEqual(translation)
    expect(data).not.toHaveProperty('status')
    expect(data).not.toHaveProperty('authorId')
    expect(data).not.toHaveProperty('rejectionReason')
  })

  it('refuses a deleted article and an unknown one', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ deletedAt: new Date() }))
    expect((await patch(translation)).status).toBe(409)

    prismaMock.article.findUnique.mockResolvedValue(null)
    expect((await patch(translation)).status).toBe(404)
  })

  it('still rejects callers with no valid token', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
    expect((await patch(translation)).status).toBe(401)
    expect(prismaMock.article.update).not.toHaveBeenCalled()
  })
})

describe('PATCH /api/articles/[id] — journalist rules are unchanged', () => {
  it('still only lets the author edit their own DRAFT/REJECTED article', async () => {
    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'someone_else', status: 'DRAFT' }))
    expect((await patch(translation)).status).toBe(403)

    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'PUBLISHED' }))
    expect((await patch(translation)).status).toBe(409)
  })

  it('still sends a REJECTED article back to DRAFT when its author edits it', async () => {
    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'REJECTED' }))
    prismaMock.article.update.mockResolvedValue(makeArticle({ status: 'DRAFT' }))

    await patch(translation)

    expect(prismaMock.article.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'DRAFT', rejectionReason: null }) }),
    )
  })

  it('lets an author save both languages of their draft', async () => {
    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'DRAFT' }))
    prismaMock.article.update.mockResolvedValue(makeArticle())

    const both = { titleId: 'Judul', titleEn: 'Title', excerptId: 'Ringkasan', excerptEn: 'Summary' }
    expect((await patch(both)).status).toBe(200)
    expect(prismaMock.article.update).toHaveBeenCalledWith(expect.objectContaining({ data: both }))
  })
})

describe('gallery routes — super admin', () => {
  const add = () =>
    addImage(
      makeRequest('/api/articles/article_1/images', { method: 'POST', body: { url: 'https://media.indonesiatanpapolusi.org/articles/admin_1/a.jpg' }, token: 't' }),
      params({ id: 'article_1' }),
    )
  const remove = () =>
    removeImage(
      makeRequest('/api/articles/article_1/images/img_1', { method: 'DELETE', token: 't' }),
      params({ id: 'article_1', imageId: 'img_1' }),
    )

  it('can add an image to a published article it did not write', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))
    prismaMock.articleImage.create.mockResolvedValue({ id: 'img_1', articleId: 'article_1', url: 'https://media.example/a.jpg', caption: null, order: 0, createdAt: new Date() })

    expect((await add()).status).toBe(201)
  })

  it('can remove an image from a published article', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))
    prismaMock.articleImage.findUnique.mockResolvedValue({ id: 'img_1', articleId: 'article_1', url: 'https://other.example/a.jpg', caption: null, order: 0, createdAt: new Date() })

    expect((await remove()).status).toBe(200)
    expect(prismaMock.articleImage.delete).toHaveBeenCalledWith({ where: { id: 'img_1' } })
  })

  it('refuses deleted articles, and journalists keep their old limits', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ deletedAt: new Date() }))
    expect((await add()).status).toBe(409)
    expect((await remove()).status).toBe(409)

    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'PUBLISHED' }))
    expect((await add()).status).toBe(409)
    expect((await remove()).status).toBe(409)
  })

  const addUrl = (url: string) =>
    addImage(
      makeRequest('/api/articles/article_1/images', { method: 'POST', body: { url }, token: 't' }),
      params({ id: 'article_1' }),
    )

  describe.each(ACCEPTED_IMAGE_URLS)('gallery image: %s', (_label, url) => {
    it('is accepted', async () => {
      asSuperAdmin()
      prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))
      prismaMock.articleImage.create.mockResolvedValue({ id: 'img_1', articleId: 'article_1', url, caption: null, order: 0, createdAt: new Date() })

      expect((await addUrl(url)).status).toBe(201)
      expect(prismaMock.articleImage.create).toHaveBeenCalledWith({ data: expect.objectContaining({ url }) })
    })
  })

  it.each(REJECTED_IMAGE_URLS)('refuses a gallery image that is a %s', async (_label, url) => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))

    expect((await addUrl(url)).status).toBe(400)
    expect(prismaMock.articleImage.create).not.toHaveBeenCalled()
  })

  it('refuses a javascript: link when fixing an article', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))
    expect((await patch({ reportUrl: 'javascript:alert(1)' })).status).toBe(400)
    expect(prismaMock.article.update).not.toHaveBeenCalled()
  })

  it.each(ACCEPTED_IMAGE_URLS)('super admin can set the cover image to: %s', async (_label, coverImage) => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))
    prismaMock.article.update.mockResolvedValue(makeArticle())

    expect((await patch({ coverImage })).status).toBe(200)
    expect(prismaMock.article.update).toHaveBeenCalledWith(expect.objectContaining({ data: { coverImage } }))
  })

  it.each(REJECTED_IMAGE_URLS)('super admin cannot set the cover image to a %s', async (_label, coverImage) => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else' }))

    expect((await patch({ coverImage })).status).toBe(400)
    expect(prismaMock.article.update).not.toHaveBeenCalled()
  })

  it.each(ACCEPTED_IMAGE_URLS)('a journalist can set their draft cover image to: %s', async (_label, coverImage) => {
    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'DRAFT' }))
    prismaMock.article.update.mockResolvedValue(makeArticle())

    expect((await patch({ coverImage })).status).toBe(200)
  })

  it.each(REJECTED_IMAGE_URLS)('a journalist cannot set their cover image to a %s', async (_label, coverImage) => {
    asJournalist()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'DRAFT' }))

    expect((await patch({ coverImage })).status).toBe(400)
    expect(prismaMock.article.update).not.toHaveBeenCalled()
  })

  it('lets a journalist keep an older article\'s existing cover while editing something else', async () => {
    asJournalist()
    const legacy = 'http://legacy.example/old-cover.jpg'
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ authorId: 'user_1', status: 'DRAFT', coverImage: legacy }))
    prismaMock.article.update.mockResolvedValue(makeArticle())

    expect((await patch({ titleEn: 'New title', coverImage: legacy })).status).toBe(200)
  })

  it('allows removing the cover image (null or empty)', async () => {
    asSuperAdmin()
    prismaMock.article.findUnique.mockResolvedValue(makeArticle({ status: 'PUBLISHED', authorId: 'someone_else', coverImage: '/news1.jpg' }))
    prismaMock.article.update.mockResolvedValue(makeArticle())

    expect((await patch({ coverImage: null })).status).toBe(200)
    expect((await patch({ coverImage: '' })).status).toBe(200)
  })

  it('rejects anonymous callers', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(null)
    expect((await add()).status).toBe(401)
    expect((await remove()).status).toBe(401)
  })
})

describe('super admins still cannot create or submit articles', () => {
  it('POST /api/articles → 401', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    const res = await create(makeRequest('/api/articles', { method: 'POST', body: { sourceLocale: 'id', titleId: 'x' }, token: 't' }))
    expect(res.status).toBe(401)
  })

  it('POST /api/articles/[id]/submit → 401', async () => {
    prismaMock.accessToken.findUnique.mockResolvedValue(null)
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    const res = await submit(makeRequest('/api/articles/article_1/submit', { method: 'POST', token: 't' }), params({ id: 'article_1' }))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/articles — bilingual titles', () => {
  const createBody = (body: unknown) => create(makeRequest('/api/articles', { method: 'POST', body, token: 't' }))

  it('needs a title in at least one language', async () => {
    asJournalist()
    expect((await createBody({ sourceLocale: 'id', titleId: ' ', titleEn: '' })).status).toBe(400)
    expect(prismaMock.article.create).not.toHaveBeenCalled()
  })

  it('accepts an article written only in English even when the source language says Indonesian', async () => {
    asJournalist()
    prismaMock.article.findFirst.mockResolvedValue(null)
    prismaMock.article.create.mockResolvedValue(makeArticle())

    const res = await createBody({ sourceLocale: 'id', titleEn: 'English only', excerptEn: 'Summary' })
    expect(res.status).toBe(201)
  })

  it.each(ACCEPTED_IMAGE_URLS)('accepts a new article whose cover image is: %s', async (_label, coverImage) => {
    asJournalist()
    prismaMock.article.findFirst.mockResolvedValue(null)
    prismaMock.article.create.mockResolvedValue(makeArticle())

    const res = await createBody({ sourceLocale: 'en', titleEn: 'With a cover', coverImage })
    expect(res.status).toBe(201)
    expect(prismaMock.article.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ coverImage }) }),
    )
  })

  it.each(REJECTED_IMAGE_URLS)('refuses a new article whose cover image is a %s', async (_label, coverImage) => {
    asJournalist()

    const res = await createBody({ sourceLocale: 'en', titleEn: 'With a cover', coverImage })
    expect(res.status).toBe(400)
    expect(prismaMock.article.create).not.toHaveBeenCalled()
  })

  it('accepts a new article without any cover image', async () => {
    asJournalist()
    prismaMock.article.findFirst.mockResolvedValue(null)
    prismaMock.article.create.mockResolvedValue(makeArticle())

    expect((await createBody({ sourceLocale: 'en', titleEn: 'No cover' })).status).toBe(201)
    expect((await createBody({ sourceLocale: 'en', titleEn: 'Null cover', coverImage: null })).status).toBe(201)
  })
})
