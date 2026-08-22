export type ArticleStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED'
export type TranslationStatus = 'PENDING' | 'DONE' | 'FAILED'
export type SourceLocale = 'id' | 'en'

export type RegionDto = {
  id: string
  slug: string
  nameId: string
  nameEn: string
}

export type ArticleAuthorDto = {
  id: string
  email: string
  name: string | null
}

export type ArticleImageDto = {
  id: string
  url: string
  caption: string | null
  order: number
}

export type ArticleDto = {
  id: string
  slug: string
  titleId: string
  titleEn: string
  excerptId: string
  excerptEn: string
  contentId: unknown
  contentEn: unknown
  sourceLocale: SourceLocale
  translationStatus: TranslationStatus
  coverImage: string | null
  reportUrl: string | null
  pressReleaseUrl: string | null
  visualUrl: string | null
  status: ArticleStatus
  rejectionReason: string | null
  publishedAt: string | null
  deletedAt: string | null
  regionId: string | null
  region: RegionDto | null
  authorId: string
  author: ArticleAuthorDto
  reviewedById: string | null
  images: ArticleImageDto[]
  createdAt: string
  updatedAt: string
}

export type ArticlePage = {
  items: ArticleDto[]
  nextCursor: string | null
}

export type PublishedArticlesParams = {
  region?: string
  search?: string
  cursor?: string
  limit?: number
}

export type CreateArticleBody = {
  titleId?: string
  titleEn?: string
  excerptId?: string
  excerptEn?: string
  contentId?: unknown
  contentEn?: unknown
  sourceLocale: SourceLocale
  regionId?: string | null
  coverImage?: string | null
  reportUrl?: string | null
  pressReleaseUrl?: string | null
  visualUrl?: string | null
}

export type UpdateArticleBody = Partial<CreateArticleBody>

export type SubmitForReviewBody = Record<string, never>

export type ReviewArticleBody = {
  action: 'approve' | 'reject'
  rejectionReason?: string
}
