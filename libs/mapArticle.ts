import type { Article, ArticleImage, Region } from '@prisma/client'
import type { ArticleDto } from '@/services/article/article.dto'

type ArticleAuthor = { id: string; email: string; name: string | null }

type ArticleWithRelations = Article & {
  region: Region | null
  images: ArticleImage[]
  author: ArticleAuthor
}

export const mapArticle = (article: ArticleWithRelations): ArticleDto => ({
  id: article.id,
  slug: article.slug,
  titleId: article.titleId,
  titleEn: article.titleEn,
  excerptId: article.excerptId,
  excerptEn: article.excerptEn,
  contentId: article.contentId,
  contentEn: article.contentEn,
  sourceLocale: article.sourceLocale as ArticleDto['sourceLocale'],
  translationStatus: article.translationStatus as ArticleDto['translationStatus'],
  coverImage: article.coverImage,
  status: article.status as ArticleDto['status'],
  rejectionReason: article.rejectionReason,
  publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
  deletedAt: article.deletedAt ? article.deletedAt.toISOString() : null,
  regionId: article.regionId,
  region: article.region
    ? {
        id: article.region.id,
        slug: article.region.slug,
        nameId: article.region.nameId,
        nameEn: article.region.nameEn,
      }
    : null,
  authorId: article.authorId,
  author: {
    id: article.author.id,
    email: article.author.email,
    name: article.author.name,
  },
  reviewedById: article.reviewedById,
  images: article.images
    .sort((a, b) => a.order - b.order)
    .map((image) => ({
      id: image.id,
      url: image.url,
      caption: image.caption,
      order: image.order,
    })),
  createdAt: article.createdAt.toISOString(),
  updatedAt: article.updatedAt.toISOString(),
})

export const articleInclude = {
  region: true,
  images: true,
  author: { select: { id: true, email: true, name: true } },
} as const
