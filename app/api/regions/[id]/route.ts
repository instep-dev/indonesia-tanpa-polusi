import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateSuperAdminAccessToken } from '@/libs/validateToken'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { getActor, pruneRevisions, revisionOps } from '@/libs/revisions'
import type { RegionDto } from '@/services/region/region.dto'
import type { UpdateRegionBody } from '@/services/region/region.dto'

const MAX_NAME_LENGTH = 80

// PATCH /api/regions/[id] — SuperAdmin renames a region's display names.
// Only `nameId` / `nameEn` can change: the slug is part of URLs and article
// filters (`?region=<slug>`), so it is deliberately not editable here.
export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const auth = await validateSuperAdminAccessToken(request, db)
  if (!auth.ok) return auth.response

  const { id } = await params
  const parsed = await parseJsonBody<Partial<UpdateRegionBody>>(request)
  if (!parsed.ok) return parsed.response

  const nameId = typeof parsed.body?.nameId === 'string' ? parsed.body.nameId.trim() : ''
  const nameEn = typeof parsed.body?.nameEn === 'string' ? parsed.body.nameEn.trim() : ''
  if (!nameId || !nameEn) {
    return NextResponse.json({ error: 'Both the Indonesian and English names are required' }, { status: 400 })
  }
  if (nameId.length > MAX_NAME_LENGTH || nameEn.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Names must be at most ${MAX_NAME_LENGTH} characters` }, { status: 400 })
  }

  const region = await db.region.findUnique({ where: { id } })
  if (!region) return NextResponse.json({ error: 'Region not found' }, { status: 404 })

  const actor = await getActor(auth.superAdminId)
  const [updated] = await db.$transaction([
    db.region.update({ where: { id }, data: { nameId, nameEn } }),
    ...revisionOps(actor, [
      { kind: 'region', targetKey: id, action: 'SAVE', snapshot: { nameId, nameEn } },
    ]),
  ])
  await pruneRevisions([{ kind: 'region', targetKey: id }])
  const renamed = updated as Awaited<ReturnType<typeof db.region.update>>
  return NextResponse.json<RegionDto>({
    id: renamed.id,
    slug: renamed.slug,
    nameId: renamed.nameId,
    nameEn: renamed.nameEn,
  })
}
