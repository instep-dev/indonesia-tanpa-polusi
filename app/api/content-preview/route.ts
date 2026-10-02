import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { generateToken, hashToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { isPreviewPath } from '@/libs/previewPath'

const TOKEN_TTL_MS = 10 * 60 * 1000

// POST /api/content-preview — SuperAdmin asks for a link that opens a public page
// in preview mode (showing unpublished drafts). The browser can't send the
// Authorization header on a normal page navigation, so the link carries a
// single-use token that is valid for 10 minutes. Only its hash is stored.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<{ path?: unknown }>(request)
  if (!parsed.ok) return parsed.response
  const path = parsed.body?.path
  if (!isPreviewPath(path)) {
    return NextResponse.json({ error: 'path must be a public page like /en or /id/news' }, { status: 400 })
  }

  const token = generateToken()
  await db.contentPreviewToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }) // tidy up
  await db.contentPreviewToken.create({
    data: {
      tokenHash: hashToken(token),
      superAdminId: auth.superAdminId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  })

  return NextResponse.json({ url: `/api/preview/enter?token=${token}&path=${encodeURIComponent(path)}` })
}
