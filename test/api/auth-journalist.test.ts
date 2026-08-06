import { POST as register } from '@/app/api/auth/register/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as refresh } from '@/app/api/auth/refresh/route'
import { DELETE as logout } from '@/app/api/auth/logout/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeUser, makeRefreshToken, PLAIN_PASSWORD } from '../fixtures'

describe('POST /api/auth/register', () => {
  it('creates a new journalist account and returns 201', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)
    prismaMock.user.create.mockResolvedValue(makeUser({ id: 'new_user' }))

    const res = await register(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email: 'new@example.com', password: PLAIN_PASSWORD, name: 'New Journalist' },
      }),
    )

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('new_user')
    expect(body.password).toBeUndefined()
  })

  it('rejects an email that is already registered', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser())

    const res = await register(
      makeRequest('/api/auth/register', {
        method: 'POST',
        body: { email: 'journalist@example.com', password: PLAIN_PASSWORD },
      }),
    )

    expect(res.status).toBe(409)
    expect(prismaMock.user.create).not.toHaveBeenCalled()
  })

  it('returns 400 on malformed JSON', async () => {
    const res = await register(
      makeRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: undefined,
      }),
    )
    // No body at all -> request.json() throws -> parseJsonBody catches it
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  it('logs a user in, issues an access token and sets the refresh cookie', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser())
    prismaMock.accessToken.create.mockResolvedValue(
      // return value is unused by the route beyond awaiting the promise
      {} as never,
    )
    prismaMock.refreshToken.create.mockResolvedValue({} as never)

    const res = await login(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'journalist@example.com', password: PLAIN_PASSWORD },
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.accessToken).toBe('string')
    expect(body.accessToken).toHaveLength(64)
    expect(body.user.email).toBe('journalist@example.com')
    expect(res.cookies.get('refresh_token')?.value).toBeTruthy()
  })

  it('rejects an unknown email with 401', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const res = await login(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'nobody@example.com', password: PLAIN_PASSWORD },
      }),
    )

    expect(res.status).toBe(401)
  })

  it('rejects a wrong password with 401', async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser())

    const res = await login(
      makeRequest('/api/auth/login', {
        method: 'POST',
        body: { email: 'journalist@example.com', password: 'totally-wrong' },
      }),
    )

    expect(res.status).toBe(401)
  })
})

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const existing = makeRefreshToken()
    prismaMock.refreshToken.findUnique.mockResolvedValue(existing)
    prismaMock.user.findUnique.mockResolvedValue(makeUser())
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.accessToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.accessToken.create.mockResolvedValue({} as never)
    prismaMock.refreshToken.create.mockResolvedValue({} as never)

    const res = await refresh(
      makeRequest('/api/auth/refresh', { method: 'POST', cookie: 'refresh_token=some-raw-token' }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(typeof body.accessToken).toBe('string')
    expect(res.cookies.get('refresh_token')?.value).toBeTruthy()
  })

  it('returns 401 when no refresh cookie is present', async () => {
    const res = await refresh(makeRequest('/api/auth/refresh', { method: 'POST' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 when the refresh token is expired', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(
      makeRefreshToken({ expiresAt: new Date(Date.now() - 1000) }),
    )

    const res = await refresh(
      makeRequest('/api/auth/refresh', { method: 'POST', cookie: 'refresh_token=expired-token' }),
    )

    expect(res.status).toBe(401)
  })

  it('returns 401 when the refresh token was already revoked', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(
      makeRefreshToken({ revokedAt: new Date() }),
    )

    const res = await refresh(
      makeRequest('/api/auth/refresh', { method: 'POST', cookie: 'refresh_token=revoked-token' }),
    )

    expect(res.status).toBe(401)
  })

  it('loses the rotation race gracefully (already-consumed token)', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(makeRefreshToken())
    prismaMock.user.findUnique.mockResolvedValue(makeUser())
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 })

    const res = await refresh(
      makeRequest('/api/auth/refresh', { method: 'POST', cookie: 'refresh_token=raced-token' }),
    )

    expect(res.status).toBe(401)
    expect(prismaMock.accessToken.create).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/auth/logout', () => {
  it('revokes tokens and clears the cookie when a session exists', async () => {
    prismaMock.refreshToken.findUnique.mockResolvedValue(makeRefreshToken())
    prismaMock.accessToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 })

    const res = await logout(
      makeRequest('/api/auth/logout', { method: 'DELETE', cookie: 'refresh_token=some-raw-token' }),
    )

    expect(res.status).toBe(200)
    expect(res.cookies.get('refresh_token')?.value).toBe('')
  })

  it('still succeeds (idempotently) with no active session', async () => {
    const res = await logout(makeRequest('/api/auth/logout', { method: 'DELETE' }))
    expect(res.status).toBe(200)
    expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled()
  })
})
