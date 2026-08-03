import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { translateArticle } from '@/libs/translate'
import { broadcastArticlesChanged } from '@/libs/sse'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import type { ArticleDto } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/articles/[id]/submit — author submits a DRAFT for review.
// Runs auto-translation for the missing-language fields; on failure the
// article still moves to PENDING_REVIEW with translationStatus=FAILED so a
// reviewer can fill in the second language manually.
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

  const sourceLocale = article.sourceLocale as 'id' | 'en'
  const title = sourceLocale === 'id' ? article.titleId : article.titleEn
  const excerpt = sourceLocale === 'id' ? article.excerptId : article.excerptEn
  const content = sourceLocale === 'id' ? article.contentId : article.contentEn

  if (!title || !excerpt) {
    return NextResponse.json(
      { error: 'Title and excerpt are required before submitting' },
      { status: 400 },
    )
  }

  const translated = await translateArticle({ sourceLocale, title, excerpt, content })

  const updated = await db.article.update({
    where: { id },
    data: {
      titleId: translated.titleId,
      titleEn: translated.titleEn,
      excerptId: translated.excerptId,
      excerptEn: translated.excerptEn,
      contentId: translated.contentId as object,
      contentEn: translated.contentEn as object,
      translationStatus: translated.status,
      status: 'PENDING_REVIEW',
    },
    include: articleInclude,
  })

  broadcastArticlesChanged()
  return NextResponse.json<ArticleDto>(mapArticle(updated))
}
