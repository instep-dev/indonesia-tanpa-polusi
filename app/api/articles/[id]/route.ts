import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { broadcastArticlesChanged } from '@/libs/sse'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import { validateArticleLinks } from '@/libs/articleInput'
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

// Only the fields present in the body are written.
const editableFields = (body: UpdateArticleBody) => ({
  ...(body.titleId !== undefined ? { titleId: body.titleId } : {}),
  ...(body.titleEn !== undefined ? { titleEn: body.titleEn } : {}),
  ...(body.excerptId !== undefined ? { excerptId: body.excerptId } : {}),
  ...(body.excerptEn !== undefined ? { excerptEn: body.excerptEn } : {}),
  ...(body.contentId !== undefined ? { contentId: body.contentId as object } : {}),
  ...(body.contentEn !== undefined ? { contentEn: body.contentEn as object } : {}),
  ...(body.sourceLocale !== undefined ? { sourceLocale: body.sourceLocale } : {}),
  ...(body.regionId !== undefined ? { regionId: body.regionId } : {}),
  ...(body.coverImage !== undefined ? { coverImage: body.coverImage } : {}),
  ...(body.reportUrl !== undefined ? { reportUrl: body.reportUrl } : {}),
  ...(body.pressReleaseUrl !== undefined ? { pressReleaseUrl: body.pressReleaseUrl } : {}),
  ...(body.visualUrl !== undefined ? { visualUrl: body.visualUrl } : {}),
})

// PATCH — dual-purpose:
//  - Journalist: edits their own DRAFT or REJECTED article.
//  - SuperAdmin ("fix mode"): edits ANY article that has not been deleted, in any
//    status — e.g. to fill in or correct a translation, even on a published
//    article. It never changes the status or the author, and (unlike a journalist
//    edit) does not send a REJECTED article back to DRAFT.
export const PATCH = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const auth = await validateAccessToken(request, db)
  if (!auth.ok) {
    const adminAuth = await validateSuperAdminAccessToken(request, db)
    if (!adminAuth.ok) return auth.response

    const target = await db.article.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (target.deletedAt) {
      return NextResponse.json({ error: 'This article has been deleted' }, { status: 409 })
    }

    const adminBody = await parseJsonBody<UpdateArticleBody>(request)
    if (!adminBody.ok) return adminBody.response
    const adminLinkError = validateArticleLinks(adminBody.body, target)
    if (adminLinkError) return NextResponse.json({ error: adminLinkError }, { status: 400 })

    const fixed = await db.article.update({
      where: { id },
      data: editableFields(adminBody.body),
      include: articleInclude,
    })

    broadcastArticlesChanged()
    return NextResponse.json<ArticleDto>(mapArticle(fixed))
  }

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
  const linkError = validateArticleLinks(body, article)
  if (linkError) return NextResponse.json({ error: linkError }, { status: 400 })

  const updated = await db.article.update({
    where: { id },
    data: {
      ...editableFields(body),
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
