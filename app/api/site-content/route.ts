import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { parseFieldEntries, parseFieldKeys } from '@/libs/siteContentInput'
import { defaultFieldValue } from '@/libs/contentMerge'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import { isFieldSnapshot } from '@/libs/revisionSnapshots'
import type { NewRevision } from '@/libs/revisions'
import { getDictionary } from '@/i18n/getDictionary'
import { allFields, getContentPage } from '@/data/content-registry'
import type { ContentFieldDto, SiteContentResponse } from '@/services/site-content/site-content.dto'

// GET /api/site-content?page=<slug> — SuperAdmin reads the editable fields of a
// CMS page (or all of them) with their stored override and built-in default.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const slug = request.nextUrl.searchParams.get('page')
  let fields = allFields
  if (slug) {
    const page = getContentPage(slug)
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    fields = page.sections.flatMap((section) => section.fields)
  }

  const keys = fields.map((field) => field.key)
  const [rows, edits, drafts, dictId, dictEn] = await Promise.all([
    db.siteContent.findMany({ where: { key: { in: keys } } }),
    // newest published revision per field → "last edited by"
    db.contentRevision.findMany({
      where: { kind: 'field', status: 'PUBLISHED', targetKey: { in: keys } },
      orderBy: { createdAt: 'desc' },
      distinct: ['targetKey'],
      select: { targetKey: true, createdByName: true, createdAt: true },
    }),
    // unpublished drafts (only visible in preview until published)
    db.contentRevision.findMany({
      where: { kind: 'field', status: 'DRAFT', targetKey: { in: keys } },
      select: { targetKey: true, snapshot: true },
    }),
    getDictionary('id'),
    getDictionary('en'),
  ])
  const stored = new Map(rows.map((row) => [row.key, row]))
  const draftsByKey = new Map(
    (drafts ?? []).flatMap((draft) => (isFieldSnapshot(draft.snapshot) ? [[draft.targetKey, draft.snapshot] as const] : [])),
  )
  const lastEdits = new Map((edits ?? []).map((edit) => [edit.targetKey, edit]))

  const result: ContentFieldDto[] = fields.map((field) => {
    const row = stored.get(field.key)
    const lastEdit = lastEdits.get(field.key)
    const defaults = defaultFieldValue(field, dictId, dictEn)
    return {
      key: field.key,
      valueId: row?.valueId ?? null,
      valueEn: row?.valueEn ?? null,
      defaultId: defaults.valueId,
      defaultEn: defaults.valueEn,
      lastEdit: lastEdit ? { by: lastEdit.createdByName, at: lastEdit.createdAt.toISOString() } : null,
      draft: draftsByKey.get(field.key) ?? null,
    }
  })

  return NextResponse.json<SiteContentResponse>({ fields: result })
}

// PUT /api/site-content — SuperAdmin PUBLISHES a batch of fields (they go live). A field
// whose values are all empty is reset to its built-in default (its row is removed).
// `clearDrafts` lists fields whose unpublished draft should be dropped, because
// what is being published supersedes it.
export const PUT = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<{ fields?: unknown; clearDrafts?: unknown }>(request)
  if (!parsed.ok) return parsed.response

  const fields = parseFieldEntries(parsed.body?.fields)
  if (!fields.ok) return NextResponse.json({ error: fields.error }, { status: 400 })

  let clearDrafts: string[] = []
  if (parsed.body?.clearDrafts !== undefined) {
    const keys = parseFieldKeys(parsed.body.clearDrafts)
    if (!keys.ok) return NextResponse.json({ error: keys.error }, { status: 400 })
    clearDrafts = keys.keys
  }

  const operations = []
  const revisions: NewRevision[] = []
  for (const field of fields.fields) {
    revisions.push({
      kind: 'field',
      targetKey: field.key,
      action: field.reset ? 'RESET' : 'SAVE',
      snapshot: { valueId: field.valueId || null, valueEn: field.valueEn || null },
    })

    if (field.reset) {
      operations.push(db.siteContent.deleteMany({ where: { key: field.key } }))
      continue
    }

    const data = { valueId: field.valueId || null, valueEn: field.valueEn || null, updatedById: auth.superAdminId }
    operations.push(
      db.siteContent.upsert({
        where: { key: field.key },
        create: { key: field.key, ...data },
        update: data,
      }),
    )
  }

  // Publishing a field also retires any draft of it.
  const draftKeys = [...new Set([...clearDrafts, ...fields.fields.map((field) => field.key)])]
  operations.push(
    db.contentRevision.deleteMany({ where: { kind: 'field', status: 'DRAFT', targetKey: { in: draftKeys } } }),
  )

  const actor = await getActor(auth.superAdminId)
  await db.$transaction([...operations, ...revisionOps(actor, revisions)])
  await pruneRevisions(revisions.map(({ kind, targetKey }) => ({ kind, targetKey })))
  return NextResponse.json({ ok: true })
}
