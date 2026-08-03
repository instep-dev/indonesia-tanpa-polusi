import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/libs/db'
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
  const { email, password } = parsed.body

  const superAdmin = await db.superAdmin.findUnique({ where: { email } })
  if (!superAdmin || !(await bcrypt.compare(password, superAdmin.password))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

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
