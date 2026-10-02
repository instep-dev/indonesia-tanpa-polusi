import { PATCH } from '@/app/api/regions/[id]/route'
import { prismaMock } from '../prisma-singleton'
import { makeRequest, params } from '../helpers'
import { makeRegion, makeSuperAdmin, makeSuperAdminAccessToken } from '../fixtures'

const asAdmin = () => {
  prismaMock.superAdminAccessToken.findUnique.mockResolvedValue(makeSuperAdminAccessToken())
  prismaMock.superAdmin.findUnique.mockResolvedValue(makeSuperAdmin({ name: 'Dewi Admin' }))
}

const patch = (body: unknown, token?: string) =>
  PATCH(makeRequest('/api/regions/region_1', { method: 'PATCH', body, token }), params({ id: 'region_1' }))

describe('PATCH /api/regions/[id]', () => {
  it('requires super admin auth', async () => {
    const res = await patch({ nameId: 'A', nameEn: 'B' })
    expect(res.status).toBe(401)
    expect(prismaMock.region.update).not.toHaveBeenCalled()
  })

  it('requires both names, within the length limit', async () => {
    asAdmin()
    expect((await patch({ nameId: 'Sulawesi' }, 't')).status).toBe(400)
    expect((await patch({ nameId: '  ', nameEn: 'X' }, 't')).status).toBe(400)
    expect((await patch({ nameId: 'x'.repeat(81), nameEn: 'X' }, 't')).status).toBe(400)
    expect(prismaMock.region.update).not.toHaveBeenCalled()
  })

  it('404s for an unknown region', async () => {
    asAdmin()
    prismaMock.region.findUnique.mockResolvedValue(null)
    expect((await patch({ nameId: 'A', nameEn: 'B' }, 't')).status).toBe(404)
  })

  it('changes only the two names — never the slug — and returns the same shape as GET', async () => {
    asAdmin()
    prismaMock.region.findUnique.mockResolvedValue(makeRegion())
    prismaMock.$transaction.mockResolvedValue([makeRegion({ nameId: 'Sulawesi Baru', nameEn: 'New Sulawesi' })])

    const res = await patch({ nameId: ' Sulawesi Baru ', nameEn: 'New Sulawesi', slug: 'hacked' }, 't')

    expect(res.status).toBe(200)
    expect(prismaMock.region.update).toHaveBeenCalledWith({
      where: { id: 'region_1' },
      data: { nameId: 'Sulawesi Baru', nameEn: 'New Sulawesi' },
    })
    expect(await res.json()).toEqual({ id: 'region_1', slug: 'sulawesi', nameId: 'Sulawesi Baru', nameEn: 'New Sulawesi' })
    // ...and the rename is recorded in the change history
    expect(prismaMock.contentRevision.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        kind: 'region',
        targetKey: 'region_1',
        action: 'SAVE',
        snapshot: { nameId: 'Sulawesi Baru', nameEn: 'New Sulawesi' },
        createdByName: 'Dewi Admin',
      }),
    })
  })
})
