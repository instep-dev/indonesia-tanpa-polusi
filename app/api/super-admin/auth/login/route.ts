import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import {
  clearFailedLogins,
  isLoginRateLimited,
  parseCredentials,
  recordFailedLogin,
  verifyPassword,
} from '@/libs/credentials'
import { generateToken, hashToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  SUPER_ADMIN_REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} from '@/libs/tokenConfig'
import type { SuperAdminAuthResponse, SuperAdminLoginBody } from '@/services/super-admin/super-admin-auth.dto'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const parsed = await parseJsonBody<SuperAdminLoginBody>(request)
  if (!parsed.ok) return parsed.response
  const credentials = parseCredentials(parsed.body)
  if (!credentials) return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  const { email, password } = credentials

  if (isLoginRateLimited(request, email)) {
    return NextResponse.json({ error: 'Too many login attempts. Try again later.' }, { status: 429 })
  }

  const superAdmin = await db.superAdmin.findUnique({ where: { email } })
  if (!(await verifyPassword(password, superAdmin?.password)) || !superAdmin) {
    recordFailedLogin(request, email)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
  clearFailedLogins(request, email)

  const rawAccess = generateToken()
  const rawRefresh = generateToken()

  await db.superAdminAccessToken.create({
    data: {
      tokenHash: hashToken(rawAccess),
      superAdminId: superAdmin.id,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    },
  })

  await db.superAdminRefreshToken.create({
    data: {
      tokenHash: hashToken(rawRefresh),
      superAdminId: superAdmin.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  })

  const response = NextResponse.json<SuperAdminAuthResponse>({
    accessToken: rawAccess,
    superAdmin: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      createdAt: superAdmin.createdAt.toISOString(),
    },
  })

  setRefreshTokenCookie(response, rawRefresh, SUPER_ADMIN_REFRESH_TOKEN_COOKIE)
  return response
}
