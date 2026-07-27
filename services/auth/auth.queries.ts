"use client"

import { useMutation } from '@tanstack/react-query'
import { authApi } from './auth.api'
import { authStore } from './auth.store'

export const useRegister = () =>
  useMutation({
    mutationFn: authApi.register,
  })

export const useLogin = () =>
  useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ accessToken, user }) => authStore.getState().setAuth({ accessToken, user }),
  })

export const useLogout = () =>
  useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => authStore.getState().clear(),
  })
