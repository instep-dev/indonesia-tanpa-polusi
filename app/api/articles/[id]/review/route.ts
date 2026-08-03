import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { broadcastArticlesChanged } from '@/libs/sse'
import { parseJsonBody } from '@/libs/parseJsonBody'
import type { ArticleDto, ReviewArticleBody } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/articles/[id]/review — SuperAdmin approves or rejects a
// PENDING_REVIEW article.
export const POST = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (article.deletedAt) {
    return NextResponse.json({ error: 'This article has been deleted' }, { status: 409 })
  }
  if (article.status !== 'PENDING_REVIEW') {
    return NextResponse.json({ error: 'Only PENDING_REVIEW articles can be reviewed' }, { status: 409 })
  }

  const parsed = await parseJsonBody<ReviewArticleBody>(request)
  if (!parsed.ok) return parsed.response
  const { body } = parsed

  if (body.action !== 'approve' && body.action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const updated = await db.article.update({
    where: { id },
    data:
      body.action === 'approve'
        ? {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            reviewedById: auth.superAdminId,
            rejectionReason: null,
          }
        : {
            status: 'REJECTED',
            reviewedById: auth.superAdminId,
            rejectionReason: body.rejectionReason ?? null,
          },
    include: articleInclude,
  })

  broadcastArticlesChanged()
  return NextResponse.json<ArticleDto>(mapArticle(updated))
}
