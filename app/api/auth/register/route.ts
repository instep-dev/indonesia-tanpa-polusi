import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/libs/db'
import type { RegisterBody, UserDto } from '@/services/auth/auth.dto'

const SALT_ROUNDS = 12

// Account creation only — no tokens issued here. The signup flow hands the
// journalist back to /auth/login (see the citizen-journalism UX flow).
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const { email, password, name } = (await request.json()) as RegisterBody

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await db.user.create({
    data: { email, password: hashedPassword, name },
  })

  return NextResponse.json<UserDto>(
    { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() },
    { status: 201 },
  )
}
