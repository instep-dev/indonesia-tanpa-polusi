import { http } from '@/libs/api'
import type { AuthResponse, LoginBody, RegisterBody, UserDto } from './auth.dto'

export const authApi = {
  register: async (body: RegisterBody): Promise<UserDto> => {
    const res = await http.post<UserDto>('/auth/register', body)
    return res.data
  },

  login: async (body: LoginBody): Promise<AuthResponse> => {
    const res = await http.post<AuthResponse>('/auth/login', body)
    return res.data
  },

  refresh: async (): Promise<AuthResponse> => {
    const res = await http.post<AuthResponse>('/auth/refresh')
    return res.data
  },

  logout: async (): Promise<void> => {
    await http.delete('/auth/logout')
  },
}
