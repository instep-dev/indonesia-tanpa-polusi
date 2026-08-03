import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { generateToken, hashToken } from '@/libs/validateToken'
import { mapUser } from '@/libs/mapUser'
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS, setRefreshTokenCookie } from '@/libs/tokenConfig'
import type { AuthResponse } from '@/services/auth/auth.dto'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const rawRefresh = request.cookies.get('refresh_token')?.value
  if (!rawRefresh) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tokenHash = hashToken(rawRefresh)
  const existing = await db.refreshToken.findUnique({ where: { tokenHash } })
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { id: existing.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Consume the refresh token first, guarding against a concurrent request
  // (e.g. two tabs, or a bootstrap call racing an interceptor retry) that
  // already rotated it. deleteMany doesn't throw when the row is gone —
  // count 0 means we lost the race, so bail instead of double-rotating.
  const consumed = await db.refreshToken.deleteMany({ where: { id: existing.id } })
  if (consumed.count === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawAccess = generateToken()
  const rawNewRefresh = generateToken()

  await db.accessToken.deleteMany({ where: { userId: user.id } })
  await db.accessToken.create({
    data: {
      tokenHash: hashToken(rawAccess),
      userId: user.id,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    },
  })

  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(rawNewRefresh),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const response = NextResponse.json<AuthResponse>({
    accessToken: rawAccess,
    user: mapUser(user),
  })

  setRefreshTokenCookie(response, rawNewRefresh)
  return response
}
