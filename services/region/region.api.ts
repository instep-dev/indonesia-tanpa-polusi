import { http } from '@/libs/api'
import type { RegionDto, UpdateRegionBody } from './region.dto'

export const regionApi = {
  getAll: async (): Promise<RegionDto[]> => {
    const res = await http.get<RegionDto[]>('/regions')
    return res.data
  },

  update: async (id: string, body: UpdateRegionBody): Promise<RegionDto> => {
    const res = await http.patch<RegionDto>(`/regions/${id}`, body)
    return res.data
  },
}
