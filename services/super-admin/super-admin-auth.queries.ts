"use client"

import { useMutation } from '@tanstack/react-query'
import { superAdminAuthApi } from './super-admin-auth.api'
import { superAdminAuthStore } from './super-admin-auth.store'

export const useSuperAdminLogin = () =>
  useMutation({
    mutationFn: superAdminAuthApi.login,
    onSuccess: ({ accessToken, superAdmin }) =>
      superAdminAuthStore.getState().setAuth({ accessToken, superAdmin }),
  })

export const useSuperAdminLogout = () =>
  useMutation({
    mutationFn: superAdminAuthApi.logout,
    onSuccess: () => superAdminAuthStore.getState().clear(),
  })
