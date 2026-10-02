import { http } from '@/libs/api'
import type { DiscardDraftsBody, SaveDraftsBody, SaveSiteContentBody, SiteContentResponse } from './site-content.dto'

export const siteContentApi = {
  getPage: async (page: string): Promise<SiteContentResponse> => {
    const res = await http.get<SiteContentResponse>('/site-content', { params: { page } })
    return res.data
  },

  save: async (body: SaveSiteContentBody): Promise<void> => {
    await http.put('/site-content', body)
  },

  saveDrafts: async (body: SaveDraftsBody): Promise<void> => {
    await http.post('/site-content/drafts', body)
  },

  discardDrafts: async (body: DiscardDraftsBody): Promise<void> => {
    await http.delete('/site-content/drafts', { data: body })
  },

  /** A single-use link that opens a public page in preview mode (shows unpublished drafts). */
  createPreviewLink: async (path: string): Promise<string> => {
    const res = await http.post<{ url: string }>('/content-preview', { path })
    return res.data.url
  },
}
