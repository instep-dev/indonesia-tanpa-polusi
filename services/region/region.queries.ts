'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { regionApi } from './region.api'
import type { UpdateRegionBody } from './region.dto'

export const regionKeys = {
  all: ['regions'] as const,
}

export const useRegions = () =>
  useQuery({
    queryKey: regionKeys.all,
    queryFn: regionApi.getAll,
  })

export const useUpdateRegion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRegionBody }) => regionApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: regionKeys.all }),
  })
}
