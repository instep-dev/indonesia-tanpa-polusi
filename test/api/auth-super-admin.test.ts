import { POST as login } from '@/app/api/super-admin/auth/login/route'
import { POST as refresh } from '@/app/api/super-admin/auth/refresh/route'
import { DELETE as logout } from '@/app/api/super-admin/auth/logout/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest } from '../helpers'
import { makeSuperAdmin, makeSuperAdminRefreshToken, PLAIN_PASSWORD } from '../fixtures'

describe('POST /api/super-admin/auth/login', () => {
  it('logs a super admin in and sets the scoped refresh cookie', async () => {
    prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin())
    prismaMock.superAdminAccessToken.create.mockResolvedValue({} as never)
    prismaMock.superAdminRefreshToken.create.mockResolvedValue({} as never)

    const res = await login(
      makeRequest('/api/super-admin/auth/login', {
        method: 'POST',
        body: { email: 'admin@example.com', password: PLAIN_PASSWORD },
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.superAdmin.email).toBe('admin@example.com')
    expect(res.cookies.get('super_admin_refresh_token')?.value).toBeTruthy()
    // Must not collide with the journalist session cookie.
    expect(res.cookies.get('refresh_token')).toBeUndefined()
  })

  it('rejects invalid credentials with 401', async () => {
    prismaMock.superAdmin.findUnique.mockResolvedValue(null)

    const res = await login(
      makeRequest('/api/super-admin/auth/login', {
        method: 'POST',
        body: { email: 'nobody@example.com', password: PLAIN_PASSWORD },
      }),
    )

    expect(res.status).toBe(401)
  })

  it.each([{}, { email: 'admin@example.com' }, { email: 42, password: 'x' }, { email: 'a@b.c', password: ['x'] }])(
    'answers 400 (not a crash) for a malformed body: %j',
    async (body) => {
      const res = await login(makeRequest('/api/super-admin/auth/login', { method: 'POST', body }))
      expect(res.status).toBe(400)
      expect(prismaMock.superAdmin.findUnique).not.toHaveBeenCalled()
    },
  )

  it('rate-limits repeated attempts for the same email', async () => {
    prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin())
    const attempt = () =>
      login(
        makeRequest('/api/super-admin/auth/login', {
          method: 'POST',
          body: { email: 'brute-force@example.com', password: 'wrong-password' },
        }),
      )

    for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401)
    expect((await attempt()).status).toBe(429)
  })

  it('never locks out an admin who signs in successfully, however often', async () => {
    prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin())
    prismaMock.superAdminAccessToken.create.mockResolvedValue({} as never)
    prismaMock.superAdminRefreshToken.create.mockResolvedValue({} as never)
    const signIn = () =>
      login(
        makeRequest('/api/super-admin/auth/login', {
          method: 'POST',
          body: { email: 'admin@example.com', password: PLAIN_PASSWORD },
        }),
      )

    for (let i = 0; i < 15; i++) expect((await signIn()).status).toBe(200)
  })

  it('forgets earlier typos once the right password is used', async () => {
    prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin())
    prismaMock.superAdminAccessToken.create.mockResolvedValue({} as never)
    prismaMock.superAdminRefreshToken.create.mockResolvedValue({} as never)
    const attempt = (password: string) =>
      login(makeRequest('/api/super-admin/auth/login', { method: 'POST', body: { email: 'typo@example.com', password } }))

    for (let i = 0; i < 9; i++) expect((await attempt('wrong')).status).toBe(401)
    expect((await attempt(PLAIN_PASSWORD)).status).toBe(200) // success wipes the 9 failures…
    for (let i = 0; i < 9; i++) expect((await attempt('wrong')).status).toBe(401) // …so 9 more are still allowed
  })
})

describe('POST /api/super-admin/auth/refresh', () => {
  it('rotates the super admin session', async () => {
    prismaMock.superAdminRefreshToken.findUnique.mockResolvedValue(makeSuperAdminRefreshToken())
    prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin())
    prismaMock.superAdminRefreshToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.superAdminAccessToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.superAdminAccessToken.create.mockResolvedValue({} as never)
    prismaMock.superAdminRefreshToken.create.mockResolvedValue({} as never)

    const res = await refresh(
      makeRequest('/api/super-admin/auth/refresh', {
        method: 'POST',
        cookie: 'super_admin_refresh_token=some-raw-token',
      }),
    )

    expect(res.status).toBe(200)
  })

  it('returns 401 without a session cookie', async () => {
    const res = await refresh(makeRequest('/api/super-admin/auth/refresh', { method: 'POST' }))
    expect(res.status).toBe(401)
  })
})

describe('DELETE /api/super-admin/auth/logout', () => {
  it('clears the super admin session cookie', async () => {
    prismaMock.superAdminRefreshToken.findUnique.mockResolvedValue(makeSuperAdminRefreshToken())
    prismaMock.superAdminAccessToken.deleteMany.mockResolvedValue({ count: 1 })
    prismaMock.superAdminRefreshToken.deleteMany.mockResolvedValue({ count: 1 })

    const res = await logout(
      makeRequest('/api/super-admin/auth/logout', {
        method: 'DELETE',
        cookie: 'super_admin_refresh_token=some-raw-token',
      }),
    )

    expect(res.status).toBe(200)
    expect(res.cookies.get('super_admin_refresh_token')?.value).toBe('')
  })
})
