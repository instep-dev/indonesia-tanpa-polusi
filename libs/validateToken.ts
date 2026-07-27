import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import type { PrismaClient } from '@prisma/client'

type ValidResult = { ok: true; userId: string }
type InvalidResult = { ok: false; response: NextResponse }

export const hashToken = (raw: string): string =>
  crypto.createHash('sha256').update(raw).digest('hex')

export const generateToken = (): string => crypto.randomBytes(32).toString('hex')

const unauthorized = (): InvalidResult => ({
  ok: false,
  response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
})

export const validateAccessToken = async (
  request: NextRequest,
  tenantDb: PrismaClient,
): Promise<ValidResult | InvalidResult> => {
  const raw = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!raw) return unauthorized()

  const tokenHash = hashToken(raw)
  const token = await tenantDb.accessToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  })

  if (!token || token.expiresAt < new Date()) return unauthorized()

  return { ok: true, userId: token.userId }
}

type SuperAdminValidResult = { ok: true; superAdminId: string }

export const validateSuperAdminAccessToken = async (
  request: NextRequest,
  db: PrismaClient,
): Promise<SuperAdminValidResult | InvalidResult> => {
  const raw = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!raw) return unauthorized()

  const tokenHash = hashToken(raw)
  const token = await db.superAdminAccessToken.findUnique({
    where: { tokenHash },
    select: { superAdminId: true, expiresAt: true },
  })

  if (!token || token.expiresAt < new Date()) return unauthorized()

  return { ok: true, superAdminId: token.superAdminId }
}
