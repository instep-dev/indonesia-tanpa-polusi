'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userApi } from './user.api'

export const userKeys = {
  all: ['users'] as const,
}

export const useJournalists = (enabled = true) =>
  useQuery({
    queryKey: userKeys.all,
    queryFn: userApi.getAll,
    enabled,
  })

export const useApproveJournalist = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}

export const useDeactivateJournalist = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userApi.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  })
}
