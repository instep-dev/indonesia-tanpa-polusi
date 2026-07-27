import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { generateToken, hashToken } from '@/libs/validateToken'
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

  await db.refreshToken.delete({ where: { id: existing.id } })
  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(rawNewRefresh),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const response = NextResponse.json<AuthResponse>({
    accessToken: rawAccess,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
  })

  setRefreshTokenCookie(response, rawNewRefresh, '/api/auth/refresh')
  return response
}
