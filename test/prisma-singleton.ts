import type { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended'
import { db } from '../libs/db'

// next/jest auto-loads .env, which points TRANSLATE_API_URL at a local
// LibreTranslate container that isn't running in the test environment —
// without this, libs/translate.ts attempts a real network call and the
// submit-route tests hang until they time out. Force the "no translation
// service configured" path instead, which is deterministic and instant.
process.env.TRANSLATE_API_URL = ''

// Replaces the real Prisma singleton (libs/db.ts, which opens a Postgres
// connection at import time) with a deep mock for every test file — see
// jest.config.js `setupFilesAfterEnv`. Any module that imports `@/libs/db`
// (route handlers, libs/generateSlug.ts, libs/requireApprovedUser.ts, ...)
// transparently receives this same mocked instance.
jest.mock('@/libs/db', () => ({
  __esModule: true,
  db: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(prismaMock)
})

export const prismaMock = db as unknown as DeepMockProxy<PrismaClient> 
