import type { NextResponse } from 'next/server'

export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const setRefreshTokenCookie = (
  response: NextResponse,
  token: string,
  path: '/api/auth/refresh' | '/api/super-admin/auth/refresh',
): void => {
  response.cookies.set('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_MS / 1000,
    path,
  })
}

export const clearRefreshTokenCookie = (
  response: NextResponse,
  path: '/api/auth/refresh' | '/api/super-admin/auth/refresh',
): void => {
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0,
    path,
  })
}
