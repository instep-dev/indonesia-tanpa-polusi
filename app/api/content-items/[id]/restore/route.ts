import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { mapContentItem } from '@/libs/mapContentItem'
import { collectionsById } from '@/data/content-registry'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import type { ContentItemDto } from '@/services/content-item/content-item.dto'

// POST /api/content-items/[id]/restore — SuperAdmin brings a removed item back
// (clears its soft-delete flag) at the end of its collection.
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const item = await db.contentItem.findFirst({ where: { id, deletedAt: { not: null } } })
  const collection = item ? collectionsById.get(item.collection) : undefined
  if (!item || !collection) return NextResponse.json({ error: 'Removed item not found' }, { status: 404 })

  const active = await db.contentItem.findMany({
    where: { collection: collection.id, deletedAt: null },
    select: { order: true },
  })
  if (active.length >= collection.maxItems) {
    return NextResponse.json(
      { error: `${collection.title} already has the maximum of ${collection.maxItems} items — remove one first` },
      { status: 400 },
    )
  }

  const order = active.reduce((max, entry) => Math.max(max, entry.order), -1) + 1
  const actor = await getActor(auth.superAdminId)
  const [restored] = await db.$transaction([
    db.contentItem.update({ where: { id }, data: { deletedAt: null, order } }),
    ...revisionOps(actor, [
      {
        kind: 'item',
        targetKey: id,
        collection: collection.id,
        action: 'RESTORE',
        snapshot: { data: mapContentItem(item).data, order, deleted: false },
      },
    ]),
  ])
  await pruneRevisions([{ kind: 'item', targetKey: id }])
  return NextResponse.json<ContentItemDto>(mapContentItem(restored as Awaited<ReturnType<typeof db.contentItem.update>>))
}
