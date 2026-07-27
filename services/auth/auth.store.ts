import { create } from 'zustand'
import type { UserDto } from './auth.dto'

type AuthState = {
  accessToken: string | null
  user: UserDto | null
  bootstrapped: boolean
  setAuth: (payload: { accessToken: string; user: UserDto }) => void
  setAccessToken: (token: string) => void
  clear: () => void
  setBootstrapped: (v: boolean) => void
}

export const authStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,
  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, user: null }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
