'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentRevisionApi } from './content-revision.api'
import type { RevisionKind } from './content-revision.dto'
import { siteContentKeys } from '@/services/site-content/site-content.queries'
import { contentItemKeys } from '@/services/content-item/content-item.queries'
import { regionKeys } from '@/services/region/region.queries'

export const contentRevisionKeys = {
  all: ['content-revisions'] as const,
  target: (kind: RevisionKind, target: string) => [...contentRevisionKeys.all, 'target', kind, target] as const,
  page: (page: string) => [...contentRevisionKeys.all, 'page', page] as const,
}

export const useTargetRevisions = (kind: RevisionKind, target: string, enabled = true) =>
  useQuery({
    queryKey: contentRevisionKeys.target(kind, target),
    queryFn: () => contentRevisionApi.forTarget(kind, target),
    enabled,
  })

export const usePageRevisions = (page: string, enabled = true) =>
  useQuery({
    queryKey: contentRevisionKeys.page(page),
    queryFn: () => contentRevisionApi.forPage(page),
    enabled,
  })

// A restore can change a field, a list item or a region name, so everything that
// shows CMS content (and the history itself) is refreshed.
export const useRestoreRevision = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contentRevisionApi.restore(id),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: siteContentKeys.all }),
        qc.invalidateQueries({ queryKey: contentItemKeys.all }),
        qc.invalidateQueries({ queryKey: regionKeys.all }),
        qc.invalidateQueries({ queryKey: contentRevisionKeys.all }),
      ]),
  })
}
