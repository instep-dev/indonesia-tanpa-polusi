import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { parseFieldEntries, parseFieldKeys } from '@/libs/siteContentInput'
import { getActor, revisionOps } from '@/libs/revisions'

// POST /api/site-content/drafts — SuperAdmin saves fields as UNPUBLISHED drafts.
// The public site is unchanged; the drafts only show up in preview mode, until
// the admin publishes (PUT /api/site-content). One draft per field: a new one replaces the old.
// A draft with no values means "back to the built-in default" once published.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<{ fields?: unknown }>(request)
  if (!parsed.ok) return parsed.response

  const fields = parseFieldEntries(parsed.body?.fields)
  if (!fields.ok) return NextResponse.json({ error: fields.error }, { status: 400 })

  const actor = await getActor(auth.superAdminId)
  await db.$transaction([
    db.contentRevision.deleteMany({
      where: { kind: 'field', status: 'DRAFT', targetKey: { in: fields.fields.map((field) => field.key) } },
    }),
    ...revisionOps(
      actor,
      fields.fields.map((field) => ({
        kind: 'field' as const,
        targetKey: field.key,
        status: 'DRAFT' as const,
        action: field.reset ? ('RESET' as const) : ('SAVE' as const),
        snapshot: { valueId: field.valueId || null, valueEn: field.valueEn || null },
      })),
    ),
  ])

  return NextResponse.json({ ok: true, saved: fields.fields.length })
}

// DELETE /api/site-content/drafts — SuperAdmin throws away drafts ({ keys: [...] }).
export const DELETE = async (request: NextRequest): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const parsed = await parseJsonBody<{ keys?: unknown }>(request)
  if (!parsed.ok) return parsed.response

  const keys = parseFieldKeys(parsed.body?.keys)
  if (!keys.ok) return NextResponse.json({ error: keys.error }, { status: 400 })

  const result = await db.contentRevision.deleteMany({
    where: { kind: 'field', status: 'DRAFT', targetKey: { in: keys.keys } },
  })
  return NextResponse.json({ ok: true, discarded: result?.count ?? 0 })
}
