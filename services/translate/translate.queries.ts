'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'vibe-toast'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'
import { translateApi } from './translate.api'
import type { TranslateLocaleCode } from './translate.dto'

// Translation is always an explicit button press; failures are reported but never
// change what the author has typed.

export const useTranslateTexts = () =>
  useMutation({
    mutationFn: ({ from, texts }: { from: TranslateLocaleCode; texts: string[] }) => translateApi.texts(from, texts),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Translation failed. Please write the text yourself.')),
  })

export const useTranslateContent = () =>
  useMutation({
    mutationFn: ({ from, content }: { from: TranslateLocaleCode; content: unknown }) => translateApi.content(from, content),
    onError: (error) => toast.error(getApiErrorMessage(error, 'Translation failed. Please write the text yourself.')),
  })
