import { proxy } from '@/proxy'
import { makeRequest } from './helpers'

describe('proxy locale header', () => {
  it.each(['en', 'id'])('forwards the %s locale of a public URL to server components', (locale) => {
    const res = proxy(makeRequest(`/${locale}/news`))
    expect(res?.headers.get('x-middleware-request-x-locale')).toBe(locale)
  })

  it('redirects a locale-less URL instead of setting a header', () => {
    const res = proxy(makeRequest('/news', { headers: { 'accept-language': 'id-ID,id;q=0.9' } }))
    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe('http://localhost/id/news')
  })

  it('leaves API and admin routes alone', () => {
    expect(proxy(makeRequest('/api/articles'))?.headers.get('x-middleware-request-x-locale')).toBeNull()
  })
})

describe('proxy: the /super-admin entry point', () => {
  const withSession = { cookie: 'super_admin_refresh_token=abc' }

  it('sends a signed-out visitor to the CMS login', () => {
    const res = proxy(makeRequest('/super-admin'))
    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe('http://localhost/super-admin/auth/login')
  })

  it.each(['/super-admin', '/super-admin/'])('sends a signed-in admin from %s to the dashboard, not the public front page', (path) => {
    const res = proxy(makeRequest(path, { headers: withSession }))
    expect(res?.status).toBe(307)
    expect(res?.headers.get('location')).toBe('http://localhost/super-admin/dashboard')
  })

  it.each(['/super-admin/dashboard', '/super-admin/content', '/super-admin/content/home', '/super-admin/journalists'])(
    'lets a signed-in admin through to %s',
    (path) => {
      const res = proxy(makeRequest(path, { headers: withSession }))
      expect(res?.headers.get('location')).toBeNull()
      expect(res?.status).toBe(200)
    },
  )

  it.each(['/super-admin/dashboard', '/super-admin/content', '/super-admin/journalists'])(
    'still guards %s when signed out',
    (path) => {
      expect(proxy(makeRequest(path))?.headers.get('location')).toBe('http://localhost/super-admin/auth/login')
    },
  )

  it('never guards the login page itself', () => {
    expect(proxy(makeRequest('/super-admin/auth/login'))?.headers.get('location')).toBeNull()
  })

  it('does not mix up the journalist session with the admin one', () => {
    const res = proxy(makeRequest('/super-admin', { headers: { cookie: 'refresh_token=abc' } }))
    expect(res?.headers.get('location')).toBe('http://localhost/super-admin/auth/login')
  })
})
