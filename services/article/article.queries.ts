'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { articleApi } from './article.api'
import type { ArticleStatus, CreateArticleBody, UpdateArticleBody, ReviewArticleBody } from './article.dto'

const PUBLISHED_PAGE_SIZE = 9

export const articleKeys = {
  all: ['articles'] as const,
  publishedRoot: () => [...articleKeys.all, 'published'] as const,
  published: (region?: string, search?: string) =>
    [...articleKeys.publishedRoot(), region ?? 'all', search ?? ''] as const,
  mine: () => [...articleKeys.all, 'mine'] as const,
  byStatus: (status: ArticleStatus) => [...articleKeys.all, 'status', status] as const,
  adminAll: () => [...articleKeys.all, 'admin-all'] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
}

// Public Latest News list — cursor-paginated, lazy-loaded on scroll via
// fetchNextPage, optionally filtered by search/region.
export const usePublishedArticles = (params: { region?: string; search?: string } = {}) =>
  useInfiniteQuery({
    queryKey: articleKeys.published(params.region, params.search),
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      articleApi.getPublished({
        region: params.region,
        search: params.search,
        limit: PUBLISHED_PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

// `enabled` should be tied to the caller's auth bootstrap flag — firing this
// before the access token is set forces an avoidable 401 that races the
// bootstrap's own refresh call over the same single-use refresh token.
export const useMyArticles = (enabled = true) =>
  useQuery({
    queryKey: articleKeys.mine(),
    queryFn: articleApi.getMine,
    enabled,
  })

export const useArticlesByStatus = (status: ArticleStatus, enabled = true) =>
  useQuery({
    queryKey: articleKeys.byStatus(status),
    queryFn: () => articleApi.getByStatus(status),
    enabled,
  })

// SuperAdmin: every article regardless of status, including soft-deleted
// ones (shown with a "Deleted" badge for audit trail).
export const useAllArticlesAdmin = (enabled = true) =>
  useQuery({
    queryKey: articleKeys.adminAll(),
    queryFn: articleApi.getAllForAdmin,
    enabled,
  })

export const useArticle = (id: string, enabled = true) =>
  useQuery({
    queryKey: articleKeys.detail(id),
    queryFn: () => articleApi.getOne(id),
    enabled: !!id && enabled,
  })

export const useCreateArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateArticleBody) => articleApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.mine() }),
  })
}

export const useUpdateArticle = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateArticleBody) => articleApi.update(id, body),
    onSuccess: (data) => {
      qc.setQueryData(articleKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: articleKeys.mine() })
    },
  })
}

export const useDeleteArticle = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.mine() }),
  })
}

// SuperAdmin: soft-deletes any article (same endpoint — the server branches
// on which auth token is presented). See app/api/articles/[id]/route.ts.
export const useDeleteArticleAsAdmin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => articleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: articleKeys.all }),
  })
}

export const useSubmitArticleForReview = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => articleApi.submitForReview(id),
    onSuccess: (data) => {
      qc.setQueryData(articleKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: articleKeys.mine() })
    },
  })
}

export const useReviewArticle = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReviewArticleBody) => articleApi.review(id, body),
    onSuccess: (data) => {
      qc.setQueryData(articleKeys.detail(id), data)
      qc.invalidateQueries({ queryKey: articleKeys.all })
    },
  })
}

export const useUpdateMainArticles = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (articleIds: string[]) => articleApi.updateMainArticles(articleIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: articleKeys.all })
    },
  })
}
