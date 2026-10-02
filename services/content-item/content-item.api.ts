import { http } from '@/libs/api'
import type {
  ContentItemDto,
  ContentItemsResponse,
  CreateContentItemBody,
  ItemData,
  ReorderContentItemsBody,
} from './content-item.dto'

export const contentItemApi = {
  getCollection: async (collection: string): Promise<ContentItemsResponse> => {
    const res = await http.get<ContentItemsResponse>('/content-items', { params: { collection } })
    return res.data
  },

  create: async (body: CreateContentItemBody): Promise<ContentItemDto[]> => {
    const res = await http.post<ContentItemDto[]>('/content-items', body)
    return res.data
  },

  update: async (id: string, data: ItemData): Promise<ContentItemDto> => {
    const res = await http.patch<ContentItemDto>(`/content-items/${id}`, { data })
    return res.data
  },

  restore: async (id: string): Promise<ContentItemDto> => {
    const res = await http.post<ContentItemDto>(`/content-items/${id}/restore`)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await http.delete(`/content-items/${id}`)
  },

  reorder: async (body: ReorderContentItemsBody): Promise<void> => {
    await http.put('/content-items/reorder', body)
  },
}
