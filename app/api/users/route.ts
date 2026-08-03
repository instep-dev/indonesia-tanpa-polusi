import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapUser } from '@/libs/mapUser'
import type { UserDto } from '@/services/auth/auth.dto'

// GET /api/users — SuperAdmin lists all journalist accounts, for the
// approval queue.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json<UserDto[]>(users.map(mapUser))
}
