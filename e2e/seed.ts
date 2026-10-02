// Seeds the LOCAL throwaway test database used by the e2e suite.
//   DATABASE_URL=postgresql://test@127.0.0.1:54329/itp_test bun run e2e/seed.ts
// Refuses to run unless DATABASE_URL is a localhost URL (see e2e/guard.ts).

import { assertLocalDatabase } from './guard'
import { ARTICLE_BOTH, ARTICLE_DRAFT, ARTICLE_ID_ONLY, E2E_JOURNALIST, E2E_SUPER_ADMIN } from './fixtures'

assertLocalDatabase(process.env.DATABASE_URL)

const doc = (heading: string, paragraph: string) => ({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: heading }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: `${paragraph} ` },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' text.' },
      ],
    },
  ],
})

const run = async () => {
  const [{ db }, bcrypt] = await Promise.all([import('@/libs/db'), import('bcryptjs')])

  // Local throwaway database only (guarded above): start from a clean slate.
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "ArticleImage", "Article", "Region", "AccessToken", "RefreshToken", "SuperAdminAccessToken", "SuperAdminRefreshToken", "User", "SuperAdmin", "SiteContent", "ContentItem", "ContentRevision", "ContentPreviewToken" RESTART IDENTITY CASCADE',
  )

  await db.region.createMany({
    data: [
      { slug: 'sulawesi', nameId: 'Sulawesi', nameEn: 'Sulawesi' },
      { slug: 'maluku-utara', nameId: 'Maluku Utara', nameEn: 'North Maluku' },
      { slug: 'kalimantan-utara', nameId: 'Kalimantan Utara', nameEn: 'North Kalimantan' },
    ],
  })
  const sulawesi = await db.region.findUniqueOrThrow({ where: { slug: 'sulawesi' } })

  await db.superAdmin.create({
    data: { email: E2E_SUPER_ADMIN.email, name: 'E2E Admin', password: bcrypt.hashSync(E2E_SUPER_ADMIN.password, 4) },
  })
  const admin = await db.superAdmin.findUniqueOrThrow({ where: { email: E2E_SUPER_ADMIN.email } })

  const journalist = await db.user.create({
    data: {
      email: E2E_JOURNALIST.email,
      name: 'E2E Journalist',
      password: bcrypt.hashSync(E2E_JOURNALIST.password, 4),
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  })

  const base = { authorId: journalist.id, translationStatus: 'DONE', publishedAt: new Date('2026-09-01T00:00:00Z') }

  await db.article.create({
    data: {
      ...base,
      slug: ARTICLE_BOTH,
      sourceLocale: 'id',
      status: 'PUBLISHED',
      isMain: true,
      regionId: sulawesi.id,
      coverImage: '/news1.jpg',
      titleId: 'Artikel dua bahasa',
      titleEn: 'Article in both languages',
      excerptId: 'Ringkasan dalam bahasa Indonesia.',
      excerptEn: 'Summary in English.',
      contentId: doc('Judul bagian', 'Isi artikel dengan teks'),
      contentEn: doc('Section heading', 'Article body with'),
    },
  })

  await db.article.create({
    data: {
      ...base,
      slug: ARTICLE_ID_ONLY,
      sourceLocale: 'id',
      status: 'PUBLISHED',
      titleId: 'Artikel hanya bahasa Indonesia',
      titleEn: '',
      excerptId: 'Ringkasan hanya dalam bahasa Indonesia.',
      excerptEn: '',
      contentId: doc('Judul bagian', 'Isi artikel tanpa terjemahan dengan teks'),
      contentEn: {},
    },
  })

  await db.article.create({
    data: {
      authorId: journalist.id,
      slug: ARTICLE_DRAFT,
      sourceLocale: 'id',
      status: 'DRAFT',
      titleId: 'Draf artikel',
      titleEn: '',
      excerptId: 'Ringkasan draf.',
      excerptEn: '',
      contentId: doc('Judul draf', 'Isi draf dengan teks'),
      contentEn: {},
    },
  })

  console.log('Seeded local test database.')
  await db.$disconnect()
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
