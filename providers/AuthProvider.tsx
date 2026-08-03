'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { authStore } from '@/services/auth/auth.store'
import type { AuthResponse } from '@/services/auth/auth.dto'

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    // React Strict Mode double-invokes effects in dev — without this guard,
    // two concurrent bootstrap calls race to consume the same single-use
    // refresh token, and the loser's 401 used to force-redirect a user who
    // was actually successfully authenticated by the winner.
    if (hasBootstrapped.current) return
    hasBootstrapped.current = true

    const bootstrap = async () => {
      try {
        const { data } = await http.post<AuthResponse>('/auth/refresh')
        authStore.getState().setAuth({ accessToken: data.accessToken, user: data.user })
      } catch {
        // Don't clobber a token some other concurrent call already set
        // successfully (e.g. the axios interceptor's own retry-on-401 refresh).
        if (!authStore.getState().accessToken) authStore.getState().clear()
      } finally {
        authStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default AuthProvider
