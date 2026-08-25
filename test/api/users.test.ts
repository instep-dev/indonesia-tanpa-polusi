import { GET as list } from '@/app/api/users/route'
import { POST as approve, DELETE as deactivate } from '@/app/api/users/[id]/approve/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeUser, makeSuperAdminAccessToken } from '../fixtures'

describe('GET /api/users', () => {
  it('requires super admin auth', async () => {
    const res = await list(makeRequest('/api/users'))
    expect(res.status).toBe(401)
  })

  it('lists journalist accounts for an authenticated super admin', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findMany.mockResolvedValue([makeUser(), makeUser({ id: 'user_2' })])

    const res = await list(makeRequest('/api/users', { token: 'raw-admin-token' }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0].password).toBeUndefined()
  })
})

describe('POST /api/users/[id]/approve', () => {
  const call = (id: string, token?: string) =>
    approve(makeRequest(`/api/users/${id}/approve`, { method: 'POST', token }), params({ id }))

  it('requires super admin auth', async () => {
    const res = await call('user_1')
    expect(res.status).toBe(401)
  })

  it('approves a pending journalist account', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: null }))
    prismaMock.user.update.mockResolvedValue(
      makeUser({ approvedAt: new Date(), approvedById: 'admin_1' }),
    )

    const res = await call('user_1', 'raw-admin-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.approvedAt).not.toBeNull()
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ approvedById: 'admin_1' }) }),
    )
  })

  it('returns 404 for a non-existent account', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(null)

    const res = await call('missing', 'raw-admin-token')
    expect(res.status).toBe(404)
  })

  it('returns 409 when the account is already approved', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))

    const res = await call('user_1', 'raw-admin-token')
    expect(res.status).toBe(409)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/users/[id]/approve', () => {
  const call = (id: string, token?: string) =>
    deactivate(makeRequest(`/api/users/${id}/approve`, { method: 'DELETE', token }), params({ id }))

  it('requires super admin auth', async () => {
    const res = await call('user_1')
    expect(res.status).toBe(401)
  })

  it('deactivates an approved journalist account', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: new Date() }))
    prismaMock.user.update.mockResolvedValue(
      makeUser({ approvedAt: null, approvedById: null }),
    )

    const res = await call('user_1', 'raw-admin-token')

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.approvedAt).toBeNull()
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ approvedAt: null, approvedById: null }) }),
    )
  })

  it('returns 404 for a non-existent account', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(null)

    const res = await call('missing', 'raw-admin-token')
    expect(res.status).toBe(404)
  })

  it('returns 409 when the account is not approved', async () => {
    prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser({ approvedAt: null }))

    const res = await call('user_1', 'raw-admin-token')
    expect(res.status).toBe(409)
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})
