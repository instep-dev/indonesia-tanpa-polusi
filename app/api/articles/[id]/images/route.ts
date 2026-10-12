import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { isAcceptableImageUrl } from '@/libs/imageHosts'
import type { ArticleImageDto } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }
type AddImageBody = { url: string; caption?: string; order?: number }

// POST /api/articles/[id]/images — attaches an image to an article's gallery. The
// image picker uploads to R2 via a separate endpoint; this only records the URL,
// which may also be a public/ path or an https image on another site.
//  - Journalist: their own DRAFT/REJECTED article.
//  - SuperAdmin: any article that has not been deleted.
export const POST = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
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
        { error: 'Images can only be added to DRAFT or REJECTED articles' },
        { status: 409 },
      )
    }
  } else if (article.deletedAt) {
    return NextResponse.json({ error: 'This article has been deleted' }, { status: 409 })
  }

  const parsed = await parseJsonBody<AddImageBody>(request)
  if (!parsed.ok) return parsed.response
  const { body } = parsed
  if (!body.url) return NextResponse.json({ error: 'url is required' }, { status: 400 })
  if (typeof body.url !== 'string' || body.url.length > 2000 || !isAcceptableImageUrl(body.url)) {
    return NextResponse.json({ error: 'url must be an https:// image URL or a /path from the site' }, { status: 400 })
  }

  const image = await db.articleImage.create({
    data: {
      articleId: id,
      url: body.url,
      caption: body.caption ?? null,
      order: body.order ?? 0,
    },
  })

  return NextResponse.json<ArticleImageDto>(
    { id: image.id, url: image.url, caption: image.caption, order: image.order },
    { status: 201 },
  )
}
