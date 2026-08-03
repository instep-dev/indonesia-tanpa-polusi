import { http } from '@/libs/api'
import type { UploadResponse } from './upload.dto'

export const uploadApi = {
  uploadImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const res = await http.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
