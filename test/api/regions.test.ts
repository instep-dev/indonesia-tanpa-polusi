import { GET } from '@/app/api/regions/route'
import { prismaMock } from '../prisma-singleton'
import { makeRegion } from '../fixtures'

describe('GET /api/regions', () => {
  it('returns the public region list', async () => {
    prismaMock.region.findMany.mockResolvedValue([
      makeRegion(),
      makeRegion({ id: 'region_2', slug: 'maluku-utara', nameEn: 'North Maluku', nameId: 'Maluku Utara' }),
    ])

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0]).toEqual({ id: 'region_1', slug: 'sulawesi', nameId: 'Sulawesi', nameEn: 'Sulawesi' })
  })
})
