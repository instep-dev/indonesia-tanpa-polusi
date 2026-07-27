'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { authStore } from '@/services/auth/auth.store'
import type { AuthResponse } from '@/services/auth/auth.dto'

const AuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await http.post<AuthResponse>('/auth/refresh')
        authStore.getState().setAuth({ accessToken: data.accessToken, user: data.user })
      } catch {
        authStore.getState().clear()
      } finally {
        authStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default AuthProvider
