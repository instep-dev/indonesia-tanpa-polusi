import { http } from '@/libs/api'
import type { ContentRevisionDto, RevisionKind } from './content-revision.dto'

export const contentRevisionApi = {
  forTarget: async (kind: RevisionKind, target: string): Promise<ContentRevisionDto[]> => {
    const res = await http.get<ContentRevisionDto[]>('/content-revisions', { params: { kind, target } })
    return res.data
  },

  forPage: async (page: string): Promise<ContentRevisionDto[]> => {
    const res = await http.get<ContentRevisionDto[]>('/content-revisions', { params: { page } })
    return res.data
  },

  restore: async (id: string): Promise<void> => {
    await http.post(`/content-revisions/${id}/restore`)
  },
}
