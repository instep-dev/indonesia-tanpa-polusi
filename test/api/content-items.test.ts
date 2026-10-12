import { GET, POST } from '@/app/api/content-items/route'
import { PATCH, DELETE } from '@/app/api/content-items/[id]/route'
import { PUT as reorder } from '@/app/api/content-items/reorder/route'
import { POST as restoreRoute } from '@/app/api/content-items/[id]/restore/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeSuperAdmin, makeSuperAdminAccessToken } from '../fixtures'
import { ACCEPTED_IMAGE_URLS, REJECTED_IMAGE_URLS } from '../image-urls'

const asAdmin = () => {
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
  prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin({ name: 'Dewi Admin' }))
}

// The change AND its history entry are written in one transaction.
const revisionsWritten = () => prismaMock.contentRevision.create.mock.calls.map(([args]) => args.data)

const story = { quote: { id: 'Halo', en: 'Hello' }, name: 'Parker G.', imageUrl: '' }
const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'item_1',
  collection: 'stories.home',
  order: 0,
  data: story,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
})

describe('auth', () => {
  it('every content-items route requires super admin auth', async () => {
    const calls = await Promise.all([
      GET(makeRequest('/api/content-items?collection=stories.home')),
      POST(makeRequest('/api/content-items', { method: 'POST', body: { collection: 'stories.home', data: story } })),
      PATCH(makeRequest('/api/content-items/item_1', { method: 'PATCH', body: { data: story } }), params({ id: 'item_1' })),
      DELETE(makeRequest('/api/content-items/item_1', { method: 'DELETE' }), params({ id: 'item_1' })),
      reorder(makeRequest('/api/content-items/reorder', { method: 'PUT', body: { collection: 'stories.home', ids: [] } })),
    ])
    expect(calls.map((res) => res.status)).toEqual([401, 401, 401, 401, 401])
  })
})

describe('GET /api/content-items', () => {
  it('404s for an unknown collection', async () => {
    asAdmin()
    expect((await GET(makeRequest('/api/content-items?collection=nope', { token: 't' }))).status).toBe(404)
  })

  it('flags built-in defaults while nothing is stored', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([])
    const res = await GET(makeRequest('/api/content-items?collection=stories.home', { token: 't' }))
    const body = await res.json()
    expect(body.usingDefaults).toBe(true)
    expect(body.items).toEqual([])
    expect(body.defaults).toHaveLength(2)
    expect(body.defaults[0]).toMatchObject({ name: 'Parker G.', imageUrl: '/stories.jpeg' })
    expect(body.defaults[0].quote).toEqual({
      id: expect.any(String),
      en: 'Why must we fall ill for electricity we don\'t even get to enjoy?',
    })
  })

  it('returns stored items', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([row()])
    const body = await (await GET(makeRequest('/api/content-items?collection=stories.home', { token: 't' }))).json()
    expect(body.usingDefaults).toBe(false)
    expect(body.items).toEqual([{ id: 'item_1', collection: 'stories.home', order: 0, data: story }])
  })
})

describe('POST /api/content-items', () => {
  const post = (body: unknown) => POST(makeRequest('/api/content-items', { method: 'POST', body, token: 't' }))

  it('rejects unknown collections and invalid data', async () => {
    asAdmin()
    expect((await post({ collection: 'nope', data: story })).status).toBe(404)
    expect((await post({ collection: 'stories.home', data: { ...story, name: '' } })).status).toBe(400)
    expect((await post({ collection: 'stories.home', data: { ...story, imageUrl: 'javascript:alert(1)' } })).status).toBe(400)
    expect(prismaMock.contentItem.create).not.toHaveBeenCalled()
  })

  it.each(ACCEPTED_IMAGE_URLS)('accepts a story photo that is: %s', async (_label, imageUrl) => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([row({ data: { ...story, imageUrl } })])

    const res = await post({ collection: 'stories.home', data: { ...story, imageUrl } })

    expect(res.status).toBe(201)
    expect(prismaMock.contentItem.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ data: { ...story, imageUrl } }),
    })
  })

  it.each(REJECTED_IMAGE_URLS)('rejects a story photo that is a %s', async (_label, imageUrl) => {
    asAdmin()

    expect((await post({ collection: 'stories.home', data: { ...story, imageUrl } })).status).toBe(400)
    expect(prismaMock.contentItem.create).not.toHaveBeenCalled()
  })

  it('appends after the last item', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([{ order: 0 }, { order: 3 }] as never)
    prismaMock.$transaction.mockResolvedValue([row({ order: 4 })])

    const res = await post({ collection: 'stories.home', data: story })
    expect(res.status).toBe(201)
    expect(prismaMock.contentItem.create).toHaveBeenCalledWith({
      data: { id: expect.any(String), collection: 'stories.home', order: 4, data: story },
    })
    const [revision] = revisionsWritten()
    expect(revision).toMatchObject({
      kind: 'item',
      collection: 'stories.home',
      action: 'CREATE',
      snapshot: { data: story, order: 4, deleted: false },
      createdById: 'admin_1',
      createdByName: 'Dewi Admin',
    })
    // the revision points at the very item that was created
    expect(revision.targetKey).toBe(prismaMock.contentItem.create.mock.calls[0][0].data.id)
  })

  it('enforces the collection size limit', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue(Array.from({ length: 6 }, (_, i) => ({ order: i })) as never)
    const res = await post({ collection: 'stories.home', data: story })
    expect(res.status).toBe(400)
    expect(prismaMock.contentItem.create).not.toHaveBeenCalled()
  })

  it('bulk-creates items (copying the defaults in)', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([])
    prismaMock.$transaction.mockResolvedValue([row(), row({ id: 'item_2', order: 1 })])

    const res = await post({ collection: 'stories.home', items: [story, { ...story, name: 'Charlie M.' }] })
    expect(res.status).toBe(201)
    expect(prismaMock.contentItem.create).toHaveBeenCalledTimes(2)
  })
})

describe('PATCH / DELETE /api/content-items/[id]', () => {
  it('updates an item after validating it', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(row())
    prismaMock.$transaction.mockResolvedValue([row({ data: { ...story, name: 'New' } })])

    const bad = await PATCH(makeRequest('/api/content-items/item_1', { method: 'PATCH', body: { data: { ...story, name: '' } }, token: 't' }), params({ id: 'item_1' }))
    expect(bad.status).toBe(400)

    const ok = await PATCH(makeRequest('/api/content-items/item_1', { method: 'PATCH', body: { data: { ...story, name: 'New' } }, token: 't' }), params({ id: 'item_1' }))
    expect(ok.status).toBe(200)
    expect(revisionsWritten()).toEqual([
      expect.objectContaining({ kind: 'item', targetKey: 'item_1', action: 'UPDATE', snapshot: { data: { ...story, name: 'New' }, order: 0, deleted: false } }),
    ])
  })

  it('404s for a missing or already-deleted item', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(null)
    const res = await DELETE(makeRequest('/api/content-items/x', { method: 'DELETE', token: 't' }), params({ id: 'x' }))
    expect(res.status).toBe(404)
  })

  it('soft-deletes', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(row())
    const res = await DELETE(makeRequest('/api/content-items/item_1', { method: 'DELETE', token: 't' }), params({ id: 'item_1' }))
    expect(res.status).toBe(200)
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({
      where: { id: 'item_1' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(prismaMock.contentItem.delete).not.toHaveBeenCalled()
    expect(revisionsWritten()).toEqual([
      expect.objectContaining({ kind: 'item', targetKey: 'item_1', action: 'DELETE', snapshot: { data: story, order: 0, deleted: true } }),
    ])
  })
})

describe('PUT /api/content-items/reorder', () => {
  const put = (body: unknown) => reorder(makeRequest('/api/content-items/reorder', { method: 'PUT', body, token: 't' }))

  it('rejects ids that do not match the collection', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never)
    expect((await put({ collection: 'stories.home', ids: ['a'] })).status).toBe(400)
    expect((await put({ collection: 'stories.home', ids: ['a', 'z'] })).status).toBe(400)
    expect((await put({ collection: 'stories.home', ids: ['a', 'a'] })).status).toBe(400)
    expect(prismaMock.contentItem.update).not.toHaveBeenCalled()
  })

  it('applies the new order', async () => {
    asAdmin()
    prismaMock.contentItem.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }] as never)
    prismaMock.$transaction.mockResolvedValue([])

    const res = await put({ collection: 'stories.home', ids: ['b', 'a'] })
    expect(res.status).toBe(200)
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({ where: { id: 'b' }, data: { order: 0 } })
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({ where: { id: 'a' }, data: { order: 1 } })
    expect(revisionsWritten()).toEqual([
      expect.objectContaining({ kind: 'collection', targetKey: 'stories.home', collection: 'stories.home', action: 'REORDER', snapshot: { ids: ['b', 'a'] } }),
    ])
  })
})

describe('POST /api/content-items/[id]/restore and the removed list', () => {
  const restoreCall = (token?: string) =>
    restoreRoute(makeRequest('/api/content-items/item_1/restore', { method: 'POST', token }), params({ id: 'item_1' }))

  it('requires super admin auth', async () => {
    expect((await restoreCall()).status).toBe(401)
  })

  it('404s when the item is not in the removed list', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(null)
    expect((await restoreCall('t')).status).toBe(404)
  })

  it('brings a removed item back at the end of its collection', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(row({ deletedAt: new Date() }))
    prismaMock.contentItem.findMany.mockResolvedValue([{ order: 0 }, { order: 4 }] as never)
    prismaMock.$transaction.mockResolvedValue([row({ order: 5 })])

    const res = await restoreCall('t')
    expect(res.status).toBe(200)
    expect(prismaMock.contentItem.update).toHaveBeenCalledWith({ where: { id: 'item_1' }, data: { deletedAt: null, order: 5 } })
    expect(revisionsWritten()).toEqual([expect.objectContaining({ kind: 'item', action: 'RESTORE', snapshot: { data: story, order: 5, deleted: false } })])
  })

  it('refuses to exceed the collection limit', async () => {
    asAdmin()
    prismaMock.contentItem.findFirst.mockResolvedValue(row({ deletedAt: new Date() }))
    prismaMock.contentItem.findMany.mockResolvedValue(Array.from({ length: 6 }, (_, i) => ({ order: i })) as never)
    expect((await restoreCall('t')).status).toBe(400)
    expect(prismaMock.contentItem.update).not.toHaveBeenCalled()
  })

  it('lists recently removed items next to the active ones', async () => {
    asAdmin()
    prismaMock.contentItem.findMany
      .mockResolvedValueOnce([row()])
      .mockResolvedValueOnce([row({ id: 'gone_1', deletedAt: new Date() })])
    const body = await (await GET(makeRequest('/api/content-items?collection=stories.home', { token: 't' }))).json()
    expect(body.items.map((i: { id: string }) => i.id)).toEqual(['item_1'])
    expect(body.removed.map((i: { id: string }) => i.id)).toEqual(['gone_1'])
  })
})
