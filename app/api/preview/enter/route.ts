import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { db } from '@/libs/db'
import { hashToken } from '@/libs/validateToken'
import { isPreviewPath } from '@/libs/previewPath'

const expired = () =>
  new NextResponse('This preview link has expired or was already used. Go back to the CMS and press Preview again.', {
    status: 401,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })

// GET /api/preview/enter?token=…&path=/en/… — turns on draft (preview) mode for
// this browser, then sends it to the page. The token is single-use.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const token = request.nextUrl.searchParams.get('token')
  const path = request.nextUrl.searchParams.get('path')
  if (!token || !isPreviewPath(path)) return new NextResponse('Invalid preview link', { status: 400 })

  const row = await db.contentPreviewToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!row || row.expiresAt < new Date()) return expired()

  // deleteMany (not delete) so a double-click that loses the race answers "expired"
  // instead of throwing on the already-removed row.
  const consumed = await db.contentPreviewToken.deleteMany({ where: { id: row.id } })
  if (consumed.count === 0) return expired()
  ;(await draftMode()).enable()

  return NextResponse.redirect(new URL(path, request.url))
}
