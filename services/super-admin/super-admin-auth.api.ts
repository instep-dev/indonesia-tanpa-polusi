import { http } from '@/libs/api'
import type { SuperAdminAuthResponse, SuperAdminLoginBody } from './super-admin-auth.dto'

export const superAdminAuthApi = {
  login: async (body: SuperAdminLoginBody): Promise<SuperAdminAuthResponse> => {
    const res = await http.post<SuperAdminAuthResponse>('/super-admin/auth/login', body)
    return res.data
  },

  refresh: async (): Promise<SuperAdminAuthResponse> => {
    const res = await http.post<SuperAdminAuthResponse>('/super-admin/auth/refresh')
    return res.data
  },

  logout: async (): Promise<void> => {
    await http.delete('/super-admin/auth/logout')
  },
}
