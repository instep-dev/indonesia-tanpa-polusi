import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapUser } from '@/libs/mapUser'
import type { UserDto } from '@/services/auth/auth.dto'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/users/[id]/approve — SuperAdmin approves a pending journalist
// account, unlocking their ability to create/submit articles.
export const POST = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (user.approvedAt) return NextResponse.json({ error: 'Already approved' }, { status: 409 })

  const updated = await db.user.update({
    where: { id },
    data: { approvedAt: new Date(), approvedById: auth.superAdminId },
  })

  return NextResponse.json<UserDto>(mapUser(updated))
}

// DELETE /api/users/[id]/approve — SuperAdmin deactivates/un-approves a journalist
export const DELETE = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!user.approvedAt) return NextResponse.json({ error: 'Not approved' }, { status: 409 })

  const updated = await db.user.update({
    where: { id },
    data: { approvedAt: null, approvedById: null },
  })

  return NextResponse.json<UserDto>(mapUser(updated))
}
