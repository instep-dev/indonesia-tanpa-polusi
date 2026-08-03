import { NextResponse } from 'next/server'
import { db } from '@/libs/db'
import type { RegionDto } from '@/services/article/article.dto'

export const GET = async (): Promise<NextResponse> => {
  const regions = await db.region.findMany({ orderBy: { nameEn: 'asc' } })

  return NextResponse.json<RegionDto[]>(
    regions.map((region) => ({
      id: region.id,
      slug: region.slug,
      nameId: region.nameId,
      nameEn: region.nameEn,
    })),
  )
}
