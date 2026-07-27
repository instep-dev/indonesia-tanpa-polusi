'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import type { SuperAdminAuthResponse } from '@/services/super-admin/super-admin-auth.dto'

const SuperAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await http.post<SuperAdminAuthResponse>('/super-admin/auth/refresh')
        superAdminAuthStore.getState().setAuth({ accessToken: data.accessToken, superAdmin: data.superAdmin })
      } catch {
        superAdminAuthStore.getState().clear()
      } finally {
        superAdminAuthStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default SuperAdminAuthProvider
