import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { broadcastArticlesChanged } from '@/libs/sse'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import type { ArticleDto, UpdateArticleBody } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }

const findViewableArticle = async (idOrSlug: string) =>
  db.article.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: articleInclude,
  })

export const GET = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const article = await findViewableArticle(id)
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // SuperAdmin can always view an article, including soft-deleted ones (audit trail).
  const adminAuth = await validateSuperAdminAccessToken(request, db)
  if (adminAuth.ok) {
    return NextResponse.json<ArticleDto>(mapArticle(article))
  }

  // Soft-deleted articles are hidden from the public and even the author.
  if (article.deletedAt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (article.status === 'PUBLISHED') {
    return NextResponse.json<ArticleDto>(mapArticle(article))
  }

  const userAuth = await validateAccessToken(request, db)
  if (userAuth.ok && userAuth.userId === article.authorId) {
    return NextResponse.json<ArticleDto>(mapArticle(article))
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

// PATCH — author edits their own DRAFT or REJECTED article.
export const PATCH = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
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
  if (article.status !== 'DRAFT' && article.status !== 'REJECTED') {
    return NextResponse.json(
      { error: 'Only DRAFT or REJECTED articles can be edited' },
      { status: 409 },
    )
  }

  const parsed = await parseJsonBody<UpdateArticleBody>(request)
  if (!parsed.ok) return parsed.response
  const { body } = parsed

  const updated = await db.article.update({
    where: { id },
    data: {
      ...(body.titleId !== undefined ? { titleId: body.titleId } : {}),
      ...(body.titleEn !== undefined ? { titleEn: body.titleEn } : {}),
      ...(body.excerptId !== undefined ? { excerptId: body.excerptId } : {}),
      ...(body.excerptEn !== undefined ? { excerptEn: body.excerptEn } : {}),
      ...(body.contentId !== undefined ? { contentId: body.contentId as object } : {}),
      ...(body.contentEn !== undefined ? { contentEn: body.contentEn as object } : {}),
      ...(body.sourceLocale !== undefined ? { sourceLocale: body.sourceLocale } : {}),
      ...(body.regionId !== undefined ? { regionId: body.regionId } : {}),
      ...(body.coverImage !== undefined ? { coverImage: body.coverImage } : {}),
      // Editing a REJECTED article resets it back to DRAFT for a fresh review cycle.
      ...(article.status === 'REJECTED' ? { status: 'DRAFT', rejectionReason: null } : {}),
    },
    include: articleInclude,
  })

  broadcastArticlesChanged()
  return NextResponse.json<ArticleDto>(mapArticle(updated))
}

// DELETE — dual-purpose:
//  - Journalist: hard-deletes their own DRAFT (unpublished, never reviewed).
//  - SuperAdmin: soft-deletes any article, any status (moderation — hides it
//    from the public site but keeps the row for audit trail).
export const DELETE = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const userAuth = await validateAccessToken(request, db)
  if (userAuth.ok) {
    if (article.authorId !== userAuth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (article.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only DRAFT articles can be deleted' }, { status: 409 })
    }

    await db.article.delete({ where: { id } })
    broadcastArticlesChanged()
    return NextResponse.json({ ok: true })
  }

  const adminAuth = await validateSuperAdminAccessToken(request, db)
  if (adminAuth.ok) {
    if (article.deletedAt) {
      return NextResponse.json({ error: 'Already deleted' }, { status: 409 })
    }

    await db.article.update({ where: { id }, data: { deletedAt: new Date() } })
    broadcastArticlesChanged()
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
