import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { validateItemData, validateValue } from '@/libs/contentValidation'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import { isFieldSnapshot, isItemSnapshot, isRegionSnapshot } from '@/libs/revisionSnapshots'
import { collectionsById, fieldsByKey } from '@/data/content-registry'

const MAX_REGION_NAME = 80

const fail = (error: string, status: number) => NextResponse.json({ error }, { status })

// POST /api/content-revisions/[id]/restore — SuperAdmin puts a field, list item or
// region name back to how it was in an earlier revision. The restore is itself
// recorded (as RESTORE), so it can be undone the same way.
export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const revision = await db.contentRevision.findUnique({ where: { id } })
  if (!revision) return fail('Revision not found', 404)
  if (revision.status !== 'PUBLISHED') return fail('Only published versions can be restored', 400)

  const actor = await getActor(auth.superAdminId)
  const { kind, targetKey, snapshot } = revision

  if (kind === 'field') {
    const field = fieldsByKey.get(targetKey)
    if (!field) return fail('This field no longer exists', 409)
    if (!isFieldSnapshot(snapshot)) return fail('This version cannot be restored', 409)

    const valueId = snapshot.valueId?.trim() ?? ''
    const valueEn = field.localized ? (snapshot.valueEn?.trim() ?? '') : ''
    for (const value of [valueId, valueEn]) {
      const error = validateValue(field.type, value)
      if (error) return fail(`This version no longer fits the field: ${error}`, 409)
    }

    const reset = !valueId && !valueEn
    const data = { valueId: valueId || null, valueEn: valueEn || null, updatedById: auth.superAdminId }
    await db.$transaction([
      reset
        ? db.siteContent.deleteMany({ where: { key: targetKey } })
        : db.siteContent.upsert({ where: { key: targetKey }, create: { key: targetKey, ...data }, update: data }),
      ...revisionOps(actor, [
        { kind: 'field', targetKey, action: 'RESTORE', snapshot: { valueId: data.valueId, valueEn: data.valueEn } },
      ]),
    ])
    await pruneRevisions([{ kind: 'field', targetKey }])
    return NextResponse.json({ ok: true })
  }

  if (kind === 'item') {
    const collection = revision.collection ? collectionsById.get(revision.collection) : undefined
    if (!collection) return fail('This list no longer exists', 409)
    if (!isItemSnapshot(snapshot)) return fail('This version cannot be restored', 409)

    const item = await db.contentItem.findUnique({ where: { id: targetKey } })
    if (!item) return fail('This item no longer exists', 404)

    const validated = validateItemData(collection, snapshot.data)
    if (!validated.ok) return fail(`This version no longer fits the form: ${validated.error}`, 409)

    // Bringing back a removed item puts it at the end of the list (and respects the size limit).
    let order = item.order
    if (item.deletedAt) {
      const active = await db.contentItem.findMany({
        where: { collection: collection.id, deletedAt: null },
        select: { order: true },
      })
      if (active.length >= collection.maxItems) {
        return fail(`${collection.title} already has the maximum of ${collection.maxItems} items — remove one first`, 400)
      }
      order = active.reduce((max, entry) => Math.max(max, entry.order), -1) + 1
    }

    await db.$transaction([
      db.contentItem.update({ where: { id: targetKey }, data: { data: validated.data, deletedAt: null, order } }),
      ...revisionOps(actor, [
        {
          kind: 'item',
          targetKey,
          collection: collection.id,
          action: 'RESTORE',
          snapshot: { data: validated.data, order, deleted: false },
        },
      ]),
    ])
    await pruneRevisions([{ kind: 'item', targetKey }])
    return NextResponse.json({ ok: true })
  }

  if (kind === 'region') {
    if (!isRegionSnapshot(snapshot)) return fail('This version cannot be restored', 409)
    const nameId = snapshot.nameId.trim()
    const nameEn = snapshot.nameEn.trim()
    if (!nameId || !nameEn || nameId.length > MAX_REGION_NAME || nameEn.length > MAX_REGION_NAME) {
      return fail('This version cannot be restored', 409)
    }
    const region = await db.region.findUnique({ where: { id: targetKey } })
    if (!region) return fail('This region no longer exists', 404)

    await db.$transaction([
      db.region.update({ where: { id: targetKey }, data: { nameId, nameEn } }),
      ...revisionOps(actor, [{ kind: 'region', targetKey, action: 'RESTORE', snapshot: { nameId, nameEn } }]),
    ])
    await pruneRevisions([{ kind: 'region', targetKey }])
    return NextResponse.json({ ok: true })
  }

  return fail('This kind of change cannot be restored', 400)
}
