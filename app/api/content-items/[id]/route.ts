import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { validateItemData } from '@/libs/contentValidation'
import { mapContentItem } from '@/libs/mapContentItem'
import { collectionsById } from '@/data/content-registry'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import type { ContentItemDto } from '@/services/content-item/content-item.dto'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/content-items/[id] — SuperAdmin edits one item's data
export const PATCH = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const item = await db.contentItem.findFirst({ where: { id, deletedAt: null } })
  const collection = item ? collectionsById.get(item.collection) : undefined
  if (!item || !collection) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  const parsed = await parseJsonBody<{ data?: unknown }>(request)
  if (!parsed.ok) return parsed.response

  const result = validateItemData(collection, parsed.body?.data)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  const actor = await getActor(auth.superAdminId)
  const [updated] = await db.$transaction([
    db.contentItem.update({ where: { id }, data: { data: result.data } }),
    ...revisionOps(actor, [
      {
        kind: 'item',
        targetKey: id,
        collection: item.collection,
        action: 'UPDATE',
        snapshot: { data: result.data, order: item.order, deleted: false },
      },
    ]),
  ])
  await pruneRevisions([{ kind: 'item', targetKey: id }])
  return NextResponse.json<ContentItemDto>(mapContentItem(updated as Awaited<ReturnType<typeof db.contentItem.update>>))
}

// DELETE /api/content-items/[id] — SuperAdmin removes an item (soft delete)
export const DELETE = async (request: NextRequest, { params }: RouteContext): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const item = await db.contentItem.findFirst({ where: { id, deletedAt: null } })
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  // Soft delete: the row stays, so it can be restored from "Recently removed" or from history.
  const actor = await getActor(auth.superAdminId)
  await db.$transaction([
    db.contentItem.update({ where: { id }, data: { deletedAt: new Date() } }),
    ...revisionOps(actor, [
      {
        kind: 'item',
        targetKey: id,
        collection: item.collection,
        action: 'DELETE',
        snapshot: { data: mapContentItem(item).data, order: item.order, deleted: true },
      },
    ]),
  ])
  await pruneRevisions([{ kind: 'item', targetKey: id }])
  return NextResponse.json({ ok: true })
}
