import { isAxiosError } from 'axios'

/** The `{ error }` message an API route responded with, or `fallback` for anything else. */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const message = isAxiosError<{ error?: string }>(error) ? error.response?.data?.error : undefined
  return message || fallback
}
