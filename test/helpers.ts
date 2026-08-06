import { NextRequest } from 'next/server'

type RequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: unknown
  cookie?: string
  token?: string
}

// Builds a real NextRequest (not a mock) so route handlers exercise the same
// header/cookie/json parsing code paths they run in production.
export const makeRequest = (url: string, options: RequestOptions = {}): NextRequest => {
  const { method = 'GET', headers = {}, body, cookie, token } = options
  const finalHeaders: Record<string, string> = { ...headers }

  if (cookie) finalHeaders.cookie = cookie
  if (token) finalHeaders.authorization = `Bearer ${token}`
  if (body !== undefined && !finalHeaders['content-type']) {
    finalHeaders['content-type'] = 'application/json'
  }

  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export const params = <T extends Record<string, string>>(value: T): { params: Promise<T> } => ({
  params: Promise.resolve(value),
})
