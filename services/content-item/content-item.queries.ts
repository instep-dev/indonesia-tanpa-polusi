'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentItemApi } from './content-item.api'
import type { CreateContentItemBody, ItemData, ReorderContentItemsBody } from './content-item.dto'

export const contentItemKeys = {
  all: ['content-items'] as const,
  collection: (collection: string) => [...contentItemKeys.all, collection] as const,
}

export const useContentItems = (collection: string, enabled = true) =>
  useQuery({
    queryKey: contentItemKeys.collection(collection),
    queryFn: () => contentItemApi.getCollection(collection),
    enabled,
  })

export const useCreateContentItems = (collection: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateContentItemBody) => contentItemApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentItemKeys.collection(collection) }),
  })
}

export const useUpdateContentItem = (collection: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ItemData }) => contentItemApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentItemKeys.collection(collection) }),
  })
}

export const useRemoveContentItem = (collection: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contentItemApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentItemKeys.collection(collection) }),
  })
}

export const useRestoreContentItem = (collection: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contentItemApi.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentItemKeys.collection(collection) }),
  })
}

export const useReorderContentItems = (collection: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReorderContentItemsBody) => contentItemApi.reorder(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: contentItemKeys.collection(collection) }),
  })
}
