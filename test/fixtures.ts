import bcrypt from 'bcryptjs'
import type {
  User,
  SuperAdmin,
  Article,
  ArticleImage,
  Region,
  AccessToken,
  RefreshToken,
  SuperAdminAccessToken,
  SuperAdminRefreshToken,
} from '@prisma/client'

export const PLAIN_PASSWORD = 'Password123!'
// Cost factor kept low (4) purely to keep the suite fast — bcrypt's own
// correctness isn't what's under test here.
export const PASSWORD_HASH = bcrypt.hashSync(PLAIN_PASSWORD, 4)

const FIXED_DATE = new Date('2026-01-01T00:00:00.000Z')

export const makeUser = (overrides: Partial<User> = {}): User => ({
  id: 'user_1',
  email: 'journalist@example.com',
  password: PASSWORD_HASH,
  name: 'Jane Journalist',
  approvedAt: null,
  approvedById: null,
  createdAt: FIXED_DATE,
  ...overrides,
})

export const makeSuperAdmin = (overrides: Partial<SuperAdmin> = {}): SuperAdmin => ({
  id: 'admin_1',
  email: 'admin@example.com',
  password: PASSWORD_HASH,
  name: 'Super Admin',
  createdAt: FIXED_DATE,
  ...overrides,
})

export const makeRegion = (overrides: Partial<Region> = {}): Region => ({
  id: 'region_1',
  slug: 'sulawesi',
  nameId: 'Sulawesi',
  nameEn: 'Sulawesi',
  createdAt: FIXED_DATE,
  ...overrides,
})

type ArticleWithRelations = Article & { region: Region | null; images: ArticleImage[]; author: User }

export const makeArticle = (overrides: Partial<ArticleWithRelations> = {}): ArticleWithRelations => ({
  id: 'article_1',
  slug: 'test-article',
  titleId: 'Judul Artikel',
  titleEn: 'Article Title',
  excerptId: 'Ringkasan artikel',
  excerptEn: 'Article excerpt',
  contentId: {},
  contentEn: {},
  sourceLocale: 'id',
  translationStatus: 'PENDING',
  coverImage: null,
  status: 'DRAFT',
  rejectionReason: null,
  publishedAt: null,
  deletedAt: null,
  regionId: null,
  region: null,
  authorId: 'user_1',
  author: makeUser(),
  reviewedById: null,
  images: [],
  createdAt: FIXED_DATE,
  updatedAt: FIXED_DATE,
  ...overrides,
})

export const makeAccessToken = (overrides: Partial<AccessToken> = {}): AccessToken => ({
  id: 'access_1',
  tokenHash: 'access-hash',
  userId: 'user_1',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  createdAt: FIXED_DATE,
  ...overrides,
})

export const makeRefreshToken = (overrides: Partial<RefreshToken> = {}): RefreshToken => ({
  id: 'refresh_1',
  tokenHash: 'refresh-hash',
  userId: 'user_1',
  replacedById: null,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: FIXED_DATE,
  ...overrides,
})

export const makeSuperAdminAccessToken = (
  overrides: Partial<SuperAdminAccessToken> = {},
): SuperAdminAccessToken => ({
  id: 'sa-access_1',
  tokenHash: 'sa-access-hash',
  superAdminId: 'admin_1',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  createdAt: FIXED_DATE,
  ...overrides,
})

export const makeSuperAdminRefreshToken = (
  overrides: Partial<SuperAdminRefreshToken> = {},
): SuperAdminRefreshToken => ({
  id: 'sa-refresh_1',
  tokenHash: 'sa-refresh-hash',
  superAdminId: 'admin_1',
  replacedById: null,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: FIXED_DATE,
  ...overrides,
})
