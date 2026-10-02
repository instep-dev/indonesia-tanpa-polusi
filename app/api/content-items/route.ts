import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { validateItemData } from '@/libs/contentValidation'
import { defaultItemData } from '@/libs/contentMerge'
import { mapContentItem } from '@/libs/mapContentItem'
import { randomUUID } from 'crypto'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import { getDictionary } from '@/i18n/getDictionary'
import { collectionsById } from '@/data/content-registry'
import type { ContentItemDto, ContentItemsResponse } from '@/services/content-item/content-item.dto'

const REMOVED_LIMIT = 20

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// GET /api/content-items?collection=<id> — SuperAdmin lists a collection's items
// plus the built-in defaults (shown while nothing is stored yet).
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const collectionId = request.nextUrl.searchParams.get('collection') ?? ''
  if (!collectionsById.has(collectionId)) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const [rows, removedRows, dictId, dictEn] = await Promise.all([
    db.contentItem.findMany({
      where: { collection: collectionId, deletedAt: null },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    }),
    db.contentItem.findMany({
      where: { collection: collectionId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      take: REMOVED_LIMIT,
    }),
    getDictionary('id'),
    getDictionary('en'),
  ])

  return NextResponse.json<ContentItemsResponse>({
    items: rows.map(mapContentItem),
    removed: removedRows.map(mapContentItem),
    defaults: defaultItemData(collectionId, dictId, dictEn),
    usingDefaults: rows.length === 0,
  })
}

// POST /api/content-items — SuperAdmin adds one item ({collection, data}) or
// several at once ({collection, items}), e.g. to copy the built-in defaults in.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<Record<string, unknown>>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const collection = isRecord(body) && typeof body.collection === 'string' ? collectionsById.get(body.collection) : undefined
  if (!isRecord(body) || !collection) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const inputs = Array.isArray(body.items) ? body.items : [body.data]
  if (inputs.length === 0 || inputs.some((input) => input === undefined)) {
    return NextResponse.json({ error: 'data or items is required' }, { status: 400 })
  }

  const validated = []
  for (const input of inputs) {
    const result = validateItemData(collection, input)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    validated.push(result.data)
  }

  const existing = await db.contentItem.findMany({
    where: { collection: collection.id, deletedAt: null },
    select: { order: true },
  })
  if (existing.length + validated.length > collection.maxItems) {
    return NextResponse.json(
      { error: `${collection.title} can have at most ${collection.maxItems} items` },
      { status: 400 },
    )
  }

  const nextOrder = existing.reduce((max, item) => Math.max(max, item.order), -1) + 1
  // Ids are chosen up front so each CREATE revision can point at its item inside the same transaction.
  const planned = validated.map((data, index) => ({ id: randomUUID(), order: nextOrder + index, data }))
  const actor = await getActor(auth.superAdminId)
  const results = await db.$transaction([
    ...planned.map((item) =>
      db.contentItem.create({ data: { id: item.id, collection: collection.id, order: item.order, data: item.data } }),
    ),
    ...revisionOps(
      actor,
      planned.map((item) => ({
        kind: 'item' as const,
        targetKey: item.id,
        collection: collection.id,
        action: 'CREATE' as const,
        snapshot: { data: item.data, order: item.order, deleted: false },
      })),
    ),
  ])
  const created = results.slice(0, planned.length) as Awaited<ReturnType<typeof db.contentItem.create>>[]
  await pruneRevisions(planned.map((item) => ({ kind: 'item' as const, targetKey: item.id })))

  return NextResponse.json<ContentItemDto[]>(created.map(mapContentItem), { status: 201 })
}
