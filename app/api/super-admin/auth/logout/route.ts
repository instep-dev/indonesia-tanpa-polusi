import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { hashToken } from '@/libs/validateToken'
import { clearRefreshTokenCookie } from '@/libs/tokenConfig'

export const DELETE = async (request: NextRequest): Promise<NextResponse> => {
  const rawRefresh = request.cookies.get('refresh_token')?.value

  if (rawRefresh) {
    const existing = await db.superAdminRefreshToken.findUnique({
      where: { tokenHash: hashToken(rawRefresh) },
    })
    if (existing) {
      await db.superAdminAccessToken.deleteMany({ where: { superAdminId: existing.superAdminId } })
      await db.superAdminRefreshToken.deleteMany({ where: { superAdminId: existing.superAdminId } })
    }
  }

  const response = NextResponse.json({ ok: true })
  clearRefreshTokenCookie(response, '/api/super-admin/auth/refresh')
  return response
}
