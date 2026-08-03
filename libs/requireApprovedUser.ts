import { NextResponse } from 'next/server'
import { db } from '@/libs/db'

type ApprovedResult = { ok: true }
type UnapprovedResult = { ok: false; response: NextResponse }

// Defense in depth: the dashboard already hides/disables Create/Edit/Submit
// for unapproved journalists, but the API must not trust that — someone
// could still hit these routes directly.
export const requireApprovedUser = async (userId: string): Promise<ApprovedResult | UnapprovedResult> => {
  const user = await db.user.findUnique({ where: { id: userId }, select: { approvedAt: true } })

  if (!user?.approvedAt) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Account pending approval' }, { status: 403 }),
    }
  }

  return { ok: true }
}
