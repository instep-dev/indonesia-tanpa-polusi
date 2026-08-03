import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/libs/db'
import { generateToken, hashToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { mapUser } from '@/libs/mapUser'
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS, setRefreshTokenCookie } from '@/libs/tokenConfig'
import type { AuthResponse, LoginBody } from '@/services/auth/auth.dto'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const parsed = await parseJsonBody<LoginBody>(request)
  if (!parsed.ok) return parsed.response
  const { email, password } = parsed.body

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const rawAccess = generateToken()
  const rawRefresh = generateToken()

  await db.accessToken.create({
    data: {
      tokenHash: hashToken(rawAccess),
      userId: user.id,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    },
  })

  await db.refreshToken.create({
    data: {
      tokenHash: hashToken(rawRefresh),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const response = NextResponse.json<AuthResponse>({
    accessToken: rawAccess,
    user: mapUser(user),
  })

  setRefreshTokenCookie(response, rawRefresh)
  return response
}
