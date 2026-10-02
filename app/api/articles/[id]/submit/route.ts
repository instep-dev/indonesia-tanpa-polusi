import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { broadcastArticlesChanged } from '@/libs/sse'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import type { ArticleDto } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/articles/[id]/submit — author submits a DRAFT for review.
// The author writes (or auto-translates, via the editor's Translate button) both
// languages before this. Submitting never translates and never touches the text:
// a title and excerpt in at least one language is enough, and a missing language
// falls back to the other one on the public site.
export const POST = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const auth = await validateAccessToken(request, db)
  if (!auth.ok) return auth.response

  const approved = await requireApprovedUser(auth.userId)
  if (!approved.ok) return approved.response

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (article.authorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (article.deletedAt) {
    return NextResponse.json({ error: 'This article has been deleted' }, { status: 409 })
  }
  if (article.status !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT articles can be submitted' }, { status: 409 })
  }

  const hasTitle = !!(article.titleId.trim() || article.titleEn.trim())
  const hasExcerpt = !!(article.excerptId.trim() || article.excerptEn.trim())
  if (!hasTitle || !hasExcerpt) {
    return NextResponse.json(
      { error: 'A title and an excerpt (in at least one language) are required before submitting' },
      { status: 400 },
    )
  }

  const updated = await db.article.update({
    where: { id },
    data: { status: 'PENDING_REVIEW' },
    include: articleInclude,
  })

  broadcastArticlesChanged()
  return NextResponse.json<ArticleDto>(mapArticle(updated))
}
