'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { siteContentApi } from './site-content.api'
import type { DiscardDraftsBody, SaveDraftsBody, SaveSiteContentBody } from './site-content.dto'

export const siteContentKeys = {
  all: ['site-content'] as const,
  page: (page: string) => [...siteContentKeys.all, 'page', page] as const,
}

export const useSiteContentPage = (page: string, enabled = true) =>
  useQuery({
    queryKey: siteContentKeys.page(page),
    queryFn: () => siteContentApi.getPage(page),
    enabled,
  })

export const useSaveSiteContent = (page: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SaveSiteContentBody) => siteContentApi.save(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: siteContentKeys.page(page) }),
  })
}

// Saves the page's changes as unpublished drafts and drops drafts that were reverted.
// The public site is not touched.
export const useSaveSiteDrafts = (page: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ save, discard }: { save: SaveDraftsBody['fields']; discard: DiscardDraftsBody['keys'] }) => {
      if (save.length > 0) await siteContentApi.saveDrafts({ fields: save })
      if (discard.length > 0) await siteContentApi.discardDrafts({ keys: discard })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: siteContentKeys.page(page) }),
  })
}

export const useCreatePreviewLink = () =>
  useMutation({ mutationFn: (path: string) => siteContentApi.createPreviewLink(path) })
