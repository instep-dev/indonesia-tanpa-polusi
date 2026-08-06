'use client'

import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'vibe-toast'
import { uploadApi } from './upload.api'

export const useUploadImage = () =>
  useMutation({
    mutationFn: (file: File) => uploadApi.uploadImage(file),
    onError: (error) => {
      const serverMessage = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined
      toast.error(serverMessage || 'Failed to upload image. Please try again.')
    },
  })
