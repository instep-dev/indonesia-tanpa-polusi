import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/libs/db'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { mapUser } from '@/libs/mapUser'
import type { RegisterBody, UserDto } from '@/services/auth/auth.dto'

const SALT_ROUNDS = 12

// Account creation only — no tokens issued here. The signup flow hands the
// journalist back to /auth/login (see the citizen-journalism UX flow).
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const parsed = await parseJsonBody<RegisterBody>(request)
  if (!parsed.ok) return parsed.response
  const { email, password, name } = parsed.body

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await db.user.create({
    data: { email, password: hashedPassword, name },
  })

  return NextResponse.json<UserDto>(mapUser(user), { status: 201 })
}
