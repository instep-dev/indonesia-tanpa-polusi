import { GET } from '@/app/api/content-revisions/route'
import { POST as restore } from '@/app/api/content-revisions/[id]/restore/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeRegion, makeSuperAdmin, makeSuperAdminAccessToken } from '../fixtures'

const asAdmin = () => {
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
  prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin({ name: 'Dewi Admin' }))
}

const revision = (overrides: Record<string, unknown> = {}) => ({
  id: 'rev_1',
  kind: 'field',
  targetKey: 'marketing.home.hero.title',
  collection: null,
  status: 'PUBLISHED',
  action: 'SAVE',
  snapshot: { valueId: 'Judul lama', valueEn: 'Old title' },
  createdById: 'admin_1',
  createdByName: 'Someone',
  createdAt: new Date('2026-10-01T10:00:00.000Z'),
  ...overrides,
})

const story = { quote: { id: 'Halo', en: 'Hello' }, name: 'Parker G.', imageUrl: '' }
const itemRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'item_1', collection: 'stories.home', order: 2, data: story, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, ...overrides,
})

const list = (query: string, token?: string) => GET(makeRequest(`/api/content-revisions${query}`, { token }))
const restoreCall = (id = 'rev_1', token = 't') =>
  restore(makeRequest(`/api/content-revisions/${id}/restore`, { method: 'POST', token }), params({ id }))
const written = () => prismaMock.contentRevision.create.mock.calls.map(([args]) => args.data)

describe('GET /api/content-revisions', () => {
  it('requires super admin auth', async () => {
    expect((await list('?page=home')).status).toBe(401)
  })

  it('rejects requests that name neither a page nor a target', async () => {
    asAdmin()
    expect((await list('', 't')).status).toBe(400)
    expect((await list('?kind=bogus&target=x', 't')).status).toBe(400)
    expect((await list('?page=nope', 't')).status).toBe(404)
  })

  it('returns one field\'s history, newest first, published only', async () => {
    asAdmin()
    prismaMock.contentRevision.findMany.mockResolvedValue([revision()] as never)

    const res = await list('?kind=field&target=marketing.home.hero.title', 't')

    expect(res.status).toBe(200)
    expect(prismaMock.contentRevision.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', kind: 'field', targetKey: 'marketing.home.hero.title' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    expect(await res.json()).toEqual([
      expect.objectContaining({ id: 'rev_1', action: 'SAVE', createdByName: 'Someone', createdAt: '2026-10-01T10:00:00.000Z' }),
    ])
  })

  it('builds a page activity feed from its fields, lists and (on the Navigation page) region names', async () => {
    asAdmin()
    prismaMock.contentRevision.findMany.mockResolvedValue([])

    await list('?page=site', 't')

    const where = prismaMock.contentRevision.findMany.mock.calls[0][0]?.where as { status: string; OR: unknown[] }
    expect(where.status).toBe('PUBLISHED')
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { kind: 'field', targetKey: { in: expect.arrayContaining(['marketing.nav.home', 'site.contact.email']) } },
        { collection: { in: ['contact.socials'] } },
        { kind: 'region' },
      ]),
    )
  })
})

describe('POST /api/content-revisions/[id]/restore', () => {
  it('requires super admin auth and an existing published revision', async () => {
    expect((await restoreCall('rev_1', '')).status).toBe(401)

    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(null)
    expect((await restoreCall()).status).toBe(404)

    prismaMock.contentRevision.findUnique.mockResolvedValue(revision({ status: 'DRAFT' }) as never)
    expect((await restoreCall()).status).toBe(400)
  })

  it('restores a field to an earlier value and records the restore', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(revision() as never)

    expect((await restoreCall()).status).toBe(200)

    expect(prismaMock.siteContent.upsert).toHaveBeenCalledWith({
      where: { key: 'marketing.home.hero.title' },
      create: { key: 'marketing.home.hero.title', valueId: 'Judul lama', valueEn: 'Old title', updatedById: 'admin_1' },
      update: { valueId: 'Judul lama', valueEn: 'Old title', updatedById: 'admin_1' },
    })
    expect(written()).toEqual([
      expect.objectContaining({ kind: 'field', action: 'RESTORE', snapshot: { valueId: 'Judul lama', valueEn: 'Old title' }, createdByName: 'Dewi Admin' }),
    ])
  })

  it('restoring a "reset" version removes the override again', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ action: 'RESET', snapshot: { valueId: null, valueEn: null } }) as never,
    )

    expect((await restoreCall()).status).toBe(200)
    expect(prismaMock.siteContent.deleteMany).toHaveBeenCalledWith({ where: { key: 'marketing.home.hero.title' } })
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
  })

  it('refuses versions that no longer fit (removed field, invalid value, broken snapshot)', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(revision({ targetKey: 'marketing.removed.key' }) as never)
    expect((await restoreCall()).status).toBe(409)

    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ targetKey: 'media.home.hero.video', snapshot: { valueId: 'http://insecure.example/a.mp4', valueEn: null } }) as never,
    )
    expect((await restoreCall()).status).toBe(409)

    prismaMock.contentRevision.findUnique.mockResolvedValue(revision({ snapshot: { nonsense: true } }) as never)
    expect((await restoreCall()).status).toBe(409)
    expect(prismaMock.siteContent.upsert).not.toHaveBeenCalled()
  })

  it('restores an item\'s earlier data in place', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ kind: 'item', targetKey: 'item_1', collection: 'stories.home', action: 'UPDATE', snapshot: { data: story, order: 2, deleted: false } }) as never,
    )
    prismaMock.contentItem.findUnique.mockResolvedValue(itemRow() as never)

    expect((await restoreCall()).status).toBe(200)
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({
      where: { id: 'item_1' },
      data: { data: story, deletedAt: null, order: 2 },
    })
    expect(written()).toEqual([expect.objectContaining({ kind: 'item', action: 'RESTORE', collection: 'stories.home' })])
  })

  it('un-deletes a removed item at the end of its list, within the size limit', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ kind: 'item', targetKey: 'item_1', collection: 'stories.home', action: 'DELETE', snapshot: { data: story, order: 0, deleted: true } }) as never,
    )
    prismaMock.contentItem.findUnique.mockResolvedValue(itemRow({ deletedAt: new Date() }) as never)
    prismaMock.contentItem.findMany.mockResolvedValue([{ order: 0 }, { order: 3 }] as never)

    expect((await restoreCall()).status).toBe(200)
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({
      where: { id: 'item_1' },
      data: { data: story, deletedAt: null, order: 4 },
    })

    prismaMock.contentItem.update.mockClear()
    prismaMock.contentItem.findMany.mockResolvedValue(Array.from({ length: 6 }, (_, i) => ({ order: i })) as never)
    expect((await restoreCall()).status).toBe(400)
    expect(prismaMock.contentItem.update).not.toHaveBeenCalled()
  })

  it('restores a region name', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ kind: 'region', targetKey: 'region_1', snapshot: { nameId: 'Sulawesi', nameEn: 'Sulawesi' } }) as never,
    )
    prismaMock.region.findUnique.mockResolvedValue(makeRegion())

    expect((await restoreCall()).status).toBe(200)
    expect(prismaMock.region.update).toHaveBeenCalledWith({ where: { id: 'region_1' }, data: { nameId: 'Sulawesi', nameEn: 'Sulawesi' } })
  })

  it('does not restore list re-orderings', async () => {
    asAdmin()
    prismaMock.contentRevision.findUnique.mockResolvedValue(
      revision({ kind: 'collection', targetKey: 'stories.home', action: 'REORDER', snapshot: { ids: ['a'] } }) as never,
    )
    expect((await restoreCall()).status).toBe(400)
  })
})
