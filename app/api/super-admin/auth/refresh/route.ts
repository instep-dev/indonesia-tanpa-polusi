import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { generateToken, hashToken } from '@/libs/validateToken'
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  SUPER_ADMIN_REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} from '@/libs/tokenConfig'
import type { SuperAdminAuthResponse } from '@/services/super-admin/super-admin-auth.dto'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const rawRefresh = request.cookies.get(SUPER_ADMIN_REFRESH_TOKEN_COOKIE)?.value
  if (!rawRefresh) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const existing = await db.superAdminRefreshToken.findUnique({
    where: { tokenHash: hashToken(rawRefresh) },
  })
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const superAdmin = await db.superAdmin.findUnique({ where: { id: existing.superAdminId } })
  if (!superAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Consume the refresh token first, guarding against a concurrent request
  // that already rotated it (deleteMany doesn't throw on a missing row).
  const consumed = await db.superAdminRefreshToken.deleteMany({ where: { id: existing.id } })
  if (consumed.count === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rawAccess = generateToken()
  const rawNewRefresh = generateToken()

  await db.superAdminAccessToken.deleteMany({ where: { superAdminId: superAdmin.id } })
  await db.superAdminAccessToken.create({
    data: {
      tokenHash: hashToken(rawAccess),
      superAdminId: superAdmin.id,
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    },
  })

  await db.superAdminRefreshToken.create({
    data: {
      tokenHash: hashToken(rawNewRefresh),
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

  setRefreshTokenCookie(response, rawNewRefresh, SUPER_ADMIN_REFRESH_TOKEN_COOKIE)
  return response
}
