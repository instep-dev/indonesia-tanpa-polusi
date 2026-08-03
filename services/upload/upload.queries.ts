'use client'

import { useMutation } from '@tanstack/react-query'
import { uploadApi } from './upload.api'

export const useUploadImage = () =>
  useMutation({
    mutationFn: (file: File) => uploadApi.uploadImage(file),
  })
