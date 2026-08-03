'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import type { SuperAdminAuthResponse } from '@/services/super-admin/super-admin-auth.dto'

const SuperAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const hasBootstrapped = useRef(false)

  useEffect(() => {
    // See AuthProvider — guards against React Strict Mode's double effect
    // invoke racing two bootstrap calls over the same single-use refresh token.
    if (hasBootstrapped.current) return
    hasBootstrapped.current = true

    const bootstrap = async () => {
      try {
        const { data } = await http.post<SuperAdminAuthResponse>('/super-admin/auth/refresh')
        superAdminAuthStore.getState().setAuth({ accessToken: data.accessToken, superAdmin: data.superAdmin })
      } catch {
        // Don't clobber a token some other concurrent call already set
        // successfully (e.g. the axios interceptor's own retry-on-401 refresh).
        if (!superAdminAuthStore.getState().accessToken) superAdminAuthStore.getState().clear()
      } finally {
        superAdminAuthStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default SuperAdminAuthProvider
