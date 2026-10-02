import { http } from '@/libs/api'
import type {
  TranslateContentResponse,
  TranslateLocaleCode,
  TranslateTextsResponse,
} from './translate.dto'

export const translateApi = {
  texts: async (from: TranslateLocaleCode, texts: string[]): Promise<string[]> => {
    const res = await http.post<TranslateTextsResponse>('/translate', { from, texts })
    return res.data.texts
  },

  content: async (from: TranslateLocaleCode, content: unknown): Promise<TranslateContentResponse> => {
    const res = await http.post<TranslateContentResponse>('/translate', { from, content })
    return res.data
  },
}
