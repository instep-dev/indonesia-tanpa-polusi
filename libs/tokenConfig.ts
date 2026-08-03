import type { NextResponse } from 'next/server'

export const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

// Journalist and super admin are separate auth systems and must not share a
// cookie name — both are set with path '/' (so the proxy can check either
// one's existence on any route), and two same-named cookies at overlapping
// paths would collide (the browser sends both, picks one arbitrarily) if a
// browser is ever logged into both at once.
export const REFRESH_TOKEN_COOKIE = 'refresh_token'
export const SUPER_ADMIN_REFRESH_TOKEN_COOKIE = 'super_admin_refresh_token'

export const setRefreshTokenCookie = (
  response: NextResponse,
  token: string,
  cookieName: string = REFRESH_TOKEN_COOKIE,
): void => {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: REFRESH_TOKEN_TTL_MS / 1000,
    path: '/',
  })
}

export const clearRefreshTokenCookie = (
  response: NextResponse,
  cookieName: string = REFRESH_TOKEN_COOKIE,
): void => {
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 0,
    path: '/',
  })
}
