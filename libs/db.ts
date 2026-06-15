import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { db: PrismaClient }

export const db =
  globalForPrisma.db ??
  new PrismaClient({
    adapter: new PrismaPg(process.env.DATABASE_URL!),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db
