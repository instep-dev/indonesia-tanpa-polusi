import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import type { ArticleDto } from '@/services/article/article.dto'

const MAX_MAIN_ARTICLES = 3

// PUT /api/articles/main — SuperAdmin sets up to 3 showcase articles for the Homepage
export const PUT = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<{ articleIds?: unknown }>(request)
  if (!parsed.ok) return parsed.response

  const rawIds = parsed.body?.articleIds
  if (!Array.isArray(rawIds) || rawIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'articleIds must be an array of article ids' }, { status: 400 })
  }

  // A repeated id is the same article picked twice, not a second article.
  const articleIds = [...new Set(rawIds as string[])]

  if (articleIds.length > MAX_MAIN_ARTICLES) {
    return NextResponse.json({ error: `You can select at most ${MAX_MAIN_ARTICLES} main articles` }, { status: 400 })
  }

  if (articleIds.length === 0) {
    return NextResponse.json({ error: 'At least 1 article must be assigned as a main article' }, { status: 400 })
  }

  // Verify all articles exist, are not deleted and are published
  const articles = await db.article.findMany({
    where: { id: { in: articleIds }, deletedAt: null },
    select: { id: true, status: true },
  })

  if (articles.length !== articleIds.length) {
    return NextResponse.json({ error: 'One or more article IDs are invalid' }, { status: 404 })
  }

  const allPublished = articles.every((a) => a.status === 'PUBLISHED')
  if (!allPublished) {
    return NextResponse.json({ error: 'Only published articles can be set as main articles' }, { status: 400 })
  }

  // Run transaction to clear existing flags and set new flags
  await db.$transaction([
    db.article.updateMany({
      where: { isMain: true },
      data: { isMain: false },
    }),
    db.article.updateMany({
      where: { id: { in: articleIds } },
      data: { isMain: true },
    }),
  ])

  // Retrieve the newly updated main articles
  const mainArticles = await db.article.findMany({
    where: { isMain: true, deletedAt: null },
    include: articleInclude,
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json<ArticleDto[]>(mainArticles.map(mapArticle))
}
