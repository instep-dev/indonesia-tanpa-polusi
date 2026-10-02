import { http } from '@/libs/api'
import type { UploadFolder, UploadResponse } from './upload.dto'

export const uploadApi = {
  uploadImage: async (file: File, folder: UploadFolder = 'articles'): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await http.post<UploadResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
