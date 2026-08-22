import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { generateUniqueArticleSlug } from '@/libs/generateSlug'
import { broadcastArticlesChanged } from '@/libs/sse'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import type { ArticleDto, ArticlePage, ArticleStatus, CreateArticleBody } from '@/services/article/article.dto'

const VALID_STATUSES: ArticleStatus[] = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED']
const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 30

// GET /api/articles — public list, published only, filterable by region/search,
// cursor-paginated. Journalists see their own drafts too via ?mine=1 (requires
// auth). SuperAdmin can list by a single status via ?status=, or everything
// (including soft-deleted, for the audit-trail table) via ?all=1.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url)
  const regionSlug = searchParams.get('region')
  const mine = searchParams.get('mine') === '1'
  const statusParam = searchParams.get('status')
  const all = searchParams.get('all') === '1'
  const cursor = searchParams.get('cursor')
  const search = searchParams.get('search')?.trim() || null
  const limitParam = Number(searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE

  if (mine) {
    const auth = await validateAccessToken(request, db)
    if (!auth.ok) return auth.response

    const articles = await db.article.findMany({
      where: { authorId: auth.userId },
      include: articleInclude,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json<ArticleDto[]>(articles.map(mapArticle))
  }

  if (all) {
    const adminAuth = await validateSuperAdminAccessToken(request, db)
    if (!adminAuth.ok) return adminAuth.response

    const articles = await db.article.findMany({
      include: articleInclude,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json<ArticleDto[]>(articles.map(mapArticle))
  }

  if (statusParam) {
    if (!VALID_STATUSES.includes(statusParam as ArticleStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const adminAuth = await validateSuperAdminAccessToken(request, db)
    if (!adminAuth.ok) return adminAuth.response

    const articles = await db.article.findMany({
      where: { status: statusParam, deletedAt: null },
      include: articleInclude,
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json<ArticleDto[]>(articles.map(mapArticle))
  }

  const articles = await db.article.findMany({
    where: {
      status: 'PUBLISHED',
      deletedAt: null,
      ...(regionSlug ? { region: { slug: regionSlug } } : {}),
      ...(search
        ? {
            OR: [
              { titleId: { contains: search, mode: 'insensitive' } },
              { titleEn: { contains: search, mode: 'insensitive' } },
              { excerptId: { contains: search, mode: 'insensitive' } },
              { excerptEn: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: articleInclude,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })

  const hasMore = articles.length > limit
  const items = hasMore ? articles.slice(0, limit) : articles
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json<ArticlePage>({ items: items.map(mapArticle), nextCursor })
}

// POST /api/articles — journalist creates a new draft.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateAccessToken(request, db)
  if (!auth.ok) return auth.response

  const approved = await requireApprovedUser(auth.userId)
  if (!approved.ok) return approved.response

  const parsed = await parseJsonBody<CreateArticleBody>(request)
  if (!parsed.ok) return parsed.response
  const { body } = parsed

  if (!body.sourceLocale || (body.sourceLocale !== 'id' && body.sourceLocale !== 'en')) {
    return NextResponse.json({ error: 'sourceLocale must be "id" or "en"' }, { status: 400 })
  }

  const title = body.sourceLocale === 'id' ? body.titleId : body.titleEn
  const slug = await generateUniqueArticleSlug(title || 'untitled')

  const article = await db.article.create({
    data: {
      slug,
      titleId: body.titleId ?? '',
      titleEn: body.titleEn ?? '',
      excerptId: body.excerptId ?? '',
      excerptEn: body.excerptEn ?? '',
      contentId: (body.contentId ?? {}) as object,
      contentEn: (body.contentEn ?? {}) as object,
      sourceLocale: body.sourceLocale,
      coverImage: body.coverImage ?? null,
      reportUrl: body.reportUrl ?? null,
      pressReleaseUrl: body.pressReleaseUrl ?? null,
      visualUrl: body.visualUrl ?? null,
      regionId: body.regionId ?? null,
      authorId: auth.userId,
    },
    include: articleInclude,
  })

  broadcastArticlesChanged()
  return NextResponse.json<ArticleDto>(mapArticle(article), { status: 201 })
}
