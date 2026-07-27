import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { db?: PrismaClient }

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  'postgresql://postgres:postgres@localhost:5432/indonesia_tanpa_polusi?schema=public'

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db
