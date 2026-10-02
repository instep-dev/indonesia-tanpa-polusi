import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { deleteImageFromR2 } from '@/libs/r2'

type RouteContext = { params: Promise<{ id: string; imageId: string }> }

// DELETE /api/articles/[id]/images/[imageId] — removes an image from an article's gallery.
//  - Journalist: their own DRAFT/REJECTED article.
//  - SuperAdmin: any article that has not been deleted.
export const DELETE = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id, imageId } = await params
  const auth = await validateAccessToken(request, db)
  const adminAuth = auth.ok ? null : await validateSuperAdminAccessToken(request, db)
  if (!auth.ok && !adminAuth?.ok) return auth.response

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (auth.ok) {
    if (article.authorId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (article.status !== 'DRAFT' && article.status !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Images can only be removed from DRAFT or REJECTED articles' },
        { status: 409 },
      )
    }
  } else if (article.deletedAt) {
    return NextResponse.json({ error: 'This article has been deleted' }, { status: 409 })
  }

  const image = await db.articleImage.findUnique({ where: { id: imageId } })
  if (!image || image.articleId !== id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await db.articleImage.delete({ where: { id: imageId } })
  await deleteImageFromR2(image.url).catch(() => {})

  return NextResponse.json({ ok: true })
}
