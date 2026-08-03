import { http } from '@/libs/api'
import type { RegionDto } from './region.dto'

export const regionApi = {
  getAll: async (): Promise<RegionDto[]> => {
    const res = await http.get<RegionDto[]>('/regions')
    return res.data
  },
}
