import { db } from '@/libs/db'

const regions = [
  { slug: 'sulawesi', nameId: 'Sulawesi', nameEn: 'Sulawesi' },
  { slug: 'malukuUtara', nameId: 'Maluku Utara', nameEn: 'North Maluku' },
  { slug: 'kalimantanUtara', nameId: 'Kalimantan Utara', nameEn: 'North Kalimantan' },
]

const seedRegions = async () => {
  for (const region of regions) {
    await db.region.upsert({
      where: { slug: region.slug },
      update: { nameId: region.nameId, nameEn: region.nameEn },
      create: region,
    })
  }

  console.log(`Seeded ${regions.length} regions.`)
}

seedRegions()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => process.exit(0))
