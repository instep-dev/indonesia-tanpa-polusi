import { http } from '@/libs/api'
import type { UserDto } from '@/services/auth/auth.dto'

export const userApi = {
  getAll: async (): Promise<UserDto[]> => {
    const res = await http.get<UserDto[]>('/users')
    return res.data
  },

  approve: async (id: string): Promise<UserDto> => {
    const res = await http.post<UserDto>(`/users/${id}/approve`)
    return res.data
  },
}
