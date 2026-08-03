import { http } from '@/libs/api'
import type {
  ArticleDto,
  ArticlePage,
  ArticleStatus,
  CreateArticleBody,
  UpdateArticleBody,
  ReviewArticleBody,
  ArticleImageDto,
  PublishedArticlesParams,
} from './article.dto'

export const articleApi = {
  // Public, published-only, cursor-paginated + searchable — used by the
  // marketing site's Latest News list.
  getPublished: async (params: PublishedArticlesParams): Promise<ArticlePage> => {
    const res = await http.get<ArticlePage>('/articles', { params })
    return res.data
  },

  getMine: async (): Promise<ArticleDto[]> => {
    const res = await http.get<ArticleDto[]>('/articles', { params: { mine: '1' } })
    return res.data
  },

  getByStatus: async (status: ArticleStatus): Promise<ArticleDto[]> => {
    const res = await http.get<ArticleDto[]>('/articles', { params: { status } })
    return res.data
  },

  getAllForAdmin: async (): Promise<ArticleDto[]> => {
    const res = await http.get<ArticleDto[]>('/articles', { params: { all: '1' } })
    return res.data
  },

  getOne: async (id: string): Promise<ArticleDto> => {
    const res = await http.get<ArticleDto>(`/articles/${id}`)
    return res.data
  },

  create: async (body: CreateArticleBody): Promise<ArticleDto> => {
    const res = await http.post<ArticleDto>('/articles', body)
    return res.data
  },

  update: async (id: string, body: UpdateArticleBody): Promise<ArticleDto> => {
    const res = await http.patch<ArticleDto>(`/articles/${id}`, body)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await http.delete(`/articles/${id}`)
  },

  submitForReview: async (id: string): Promise<ArticleDto> => {
    const res = await http.post<ArticleDto>(`/articles/${id}/submit`)
    return res.data
  },

  review: async (id: string, body: ReviewArticleBody): Promise<ArticleDto> => {
    const res = await http.post<ArticleDto>(`/articles/${id}/review`, body)
    return res.data
  },

  addImage: async (
    id: string,
    body: { url: string; caption?: string; order?: number },
  ): Promise<ArticleImageDto> => {
    const res = await http.post<ArticleImageDto>(`/articles/${id}/images`, body)
    return res.data
  },

  removeImage: async (id: string, imageId: string): Promise<void> => {
    await http.delete(`/articles/${id}/images/${imageId}`)
  },
}
