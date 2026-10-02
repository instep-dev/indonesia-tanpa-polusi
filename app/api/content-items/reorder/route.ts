import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { collectionsById } from '@/data/content-registry'
import { getActor, revisionOps } from '@/libs/revisions'
import type { ReorderContentItemsBody } from '@/services/content-item/content-item.dto'

// PUT /api/content-items/reorder — SuperAdmin sets the display order of a
// collection. `ids` must be exactly the collection's current items.
export const PUT = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<Partial<ReorderContentItemsBody>>(request)
  if (!parsed.ok) return parsed.response
  const { collection, ids } = parsed.body ?? {}

  if (typeof collection !== 'string' || !collectionsById.has(collection)) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string') || new Set(ids).size !== ids.length) {
    return NextResponse.json({ error: 'ids must be an array of unique item ids' }, { status: 400 })
  }

  const current = await db.contentItem.findMany({
    where: { collection, deletedAt: null },
    select: { id: true },
  })
  const currentIds = new Set(current.map((item) => item.id))
  if (current.length !== ids.length || !ids.every((id) => currentIds.has(id))) {
    return NextResponse.json({ error: 'ids must match the collection\'s items' }, { status: 400 })
  }

  const actor = await getActor(auth.superAdminId)
  await db.$transaction([
    ...ids.map((id, index) => db.contentItem.update({ where: { id }, data: { order: index } })),
    ...revisionOps(actor, [
      { kind: 'collection', targetKey: collection, collection, action: 'REORDER', snapshot: { ids } },
    ]),
  ])
  return NextResponse.json({ ok: true })
}
