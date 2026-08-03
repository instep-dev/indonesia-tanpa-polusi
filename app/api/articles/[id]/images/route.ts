import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import type { ArticleImageDto } from '@/services/article/article.dto'

type RouteContext = { params: Promise<{ id: string }> }
type AddImageBody = { url: string; caption?: string; order?: number }

// POST /api/articles/[id]/images — author attaches an R2-uploaded image to
// their own DRAFT/REJECTED article's gallery. Upload to R2 happens client-side
// or via a separate upload endpoint; this only records the resulting URL.
export const POST = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const { id } = await params
  const auth = await validateAccessToken(request, db)
  if (!auth.ok) return auth.response

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (article.authorId !== auth.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (article.status !== 'DRAFT' && article.status !== 'REJECTED') {
    return NextResponse.json(
      { error: 'Images can only be added to DRAFT or REJECTED articles' },
      { status: 409 },
    )
  }

  const parsed = await parseJsonBody<AddImageBody>(request)
  if (!parsed.ok) return parsed.response
  const { body } = parsed
  if (!body.url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

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
