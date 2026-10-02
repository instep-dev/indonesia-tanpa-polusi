import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { getContentPage } from '@/data/content-registry'
import type { ContentRevisionDto, RevisionAction, RevisionKind } from '@/services/content-revision/content-revision.dto'

const FIELD_LIMIT = 50
const PAGE_LIMIT = 40
const KINDS: readonly string[] = ['field', 'item', 'collection', 'region']

// GET /api/content-revisions — SuperAdmin reads change history, newest first.
//   ?kind=field&target=<key>   history of one field / item / region
//   ?page=<slug>               recent activity across a CMS page (its fields, lists and region names)
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const params = request.nextUrl.searchParams
  const pageSlug = params.get('page')
  const kind = params.get('kind')
  const target = params.get('target')

  let where: Prisma.ContentRevisionWhereInput
  let take: number

  if (pageSlug) {
    const page = getContentPage(pageSlug)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

    const keys = page.sections.flatMap((section) => section.fields.map((field) => field.key))
    const collections = page.collections.map((collection) => collection.id)
    where = {
      status: 'PUBLISHED',
      OR: [
        { kind: 'field', targetKey: { in: keys } },
        ...(collections.length > 0 ? [{ collection: { in: collections } }] : []),
        ...(page.showRegionNames ? [{ kind: 'region' }] : []),
      ],
    }
    take = PAGE_LIMIT
  } else if (kind && target && KINDS.includes(kind)) {
    where = { status: 'PUBLISHED', kind, targetKey: target }
    take = FIELD_LIMIT
  } else {
    return NextResponse.json({ error: 'Pass ?page=<slug> or ?kind=<kind>&target=<key>' }, { status: 400 })
  }

  const rows = await db.contentRevision.findMany({ where, orderBy: { createdAt: 'desc' }, take })

  return NextResponse.json<ContentRevisionDto[]>(
    rows.map((row) => ({
      id: row.id,
      kind: row.kind as RevisionKind,
      targetKey: row.targetKey,
      collection: row.collection,
      status: row.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      action: row.action as RevisionAction,
      snapshot: row.snapshot,
      createdByName: row.createdByName,
      createdAt: row.createdAt.toISOString(),
    })),
  )
}
