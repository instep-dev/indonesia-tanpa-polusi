'use client'

import { useQuery } from '@tanstack/react-query'
import { regionApi } from './region.api'

export const regionKeys = {
  all: ['regions'] as const,
}

export const useRegions = () =>
  useQuery({
    queryKey: regionKeys.all,
    queryFn: regionApi.getAll,
  })
