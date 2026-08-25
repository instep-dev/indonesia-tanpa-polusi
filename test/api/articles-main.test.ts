import { PUT as updateMain } from '@/app/api/articles/main/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeArticle, makeSuperAdminAccessToken } from '../fixtures'

const call = (body: unknown, token?: string) =>
  updateMain(makeRequest('/api/articles/main', { method: 'PUT', body, token }))

describe('PUT /api/articles/main', () => {
  it('requires super admin auth', async () => {
    const res = await call({ articleIds: ['art_1'] })
    expect(res.status).toBe(401)
  })

  it('updates main showcase articles successfully', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    
    // Mock existence check (returns the requested articles)
    prismaMock.article.findMany
      .mockResolvedValueOnce([
        makeArticle({ id: 'art_1', status: 'PUBLISHED' }),
        makeArticle({ id: 'art_2', status: 'PUBLISHED' }),
      ])
      // Mock subsequent retrieval check in same handler
      .mockResolvedValueOnce([
        makeArticle({ id: 'art_1', status: 'PUBLISHED', isMain: true }),
        makeArticle({ id: 'art_2', status: 'PUBLISHED', isMain: true }),
      ])

    prismaMock.$transaction.mockResolvedValue([])

    const res = await call({ articleIds: ['art_1', 'art_2'] }, 'raw-admin-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0].isMain).toBe(true)
    expect(prismaMock.article.updateMany).toHaveBeenCalledTimes(2)
  })

  it('returns 400 if articleIds is not an array', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())

    const res = await call({ articleIds: 'not-an-array' }, 'raw-admin-token')
    expect(res.status).toBe(400)
  })

  it('returns 400 if more than 3 articleIds are provided', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())

    const res = await call({ articleIds: ['1', '2', '3', '4'] }, 'raw-admin-token')
    expect(res.status).toBe(400)
  })

  it('returns 404 if one of the articles does not exist', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findMany.mockResolvedValue([makeArticle({ id: 'art_1' })])

    const res = await call({ articleIds: ['art_1', 'missing'] }, 'raw-admin-token')
    expect(res.status).toBe(404)
  })

  it('returns 400 if one of the articles is not published', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.article.findMany.mockResolvedValue([
      makeArticle({ id: 'art_1', status: 'PUBLISHED' }),
      makeArticle({ id: 'art_2', status: 'DRAFT' }),
    ])

    const res = await call({ articleIds: ['art_1', 'art_2'] }, 'raw-admin-token')
    expect(res.status).toBe(400)
  })

  it('returns 400 if articleIds is empty', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())

    const res = await call({ articleIds: [] }, 'raw-admin-token')
    expect(res.status).toBe(400)
  })
})
