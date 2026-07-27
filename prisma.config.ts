import 'dotenv/config'
import { defineConfig } from '@prisma/config'

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  'postgresql://postgres:postgres@localhost:5432/indonesia_tanpa_polusi?schema=public'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
