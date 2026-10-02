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
