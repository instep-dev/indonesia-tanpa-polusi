'use client'

import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { toast } from 'vibe-toast'
import { uploadApi } from './upload.api'
import type { UploadFolder } from './upload.dto'

export const useUploadImage = (folder: UploadFolder = 'articles') =>
  useMutation({
    mutationFn: (file: File) => uploadApi.uploadImage(file, folder),
    onError: (error) => {
      const serverMessage = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : undefined
      toast.error(serverMessage || 'Failed to upload image. Please try again.')
    },
  })
