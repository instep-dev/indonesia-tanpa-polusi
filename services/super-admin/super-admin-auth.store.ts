import { create } from 'zustand'
import type { SuperAdminDto } from './super-admin-auth.dto'

type SuperAdminAuthState = {
  accessToken: string | null
  superAdmin: SuperAdminDto | null
  bootstrapped: boolean
  setAuth: (payload: { accessToken: string; superAdmin: SuperAdminDto }) => void
  setAccessToken: (token: string) => void
  clear: () => void
  setBootstrapped: (v: boolean) => void
}

export const superAdminAuthStore = create<SuperAdminAuthState>()((set) => ({
  accessToken: null,
  superAdmin: null,
  bootstrapped: false,
  setAuth: ({ accessToken, superAdmin }) => set({ accessToken, superAdmin }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, superAdmin: null }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
