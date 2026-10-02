import { headers } from 'next/headers'
import type { Locale } from '@/i18n/getDictionary'
import { LOCALE_HEADER } from '@/libs/localeHeaderName'

// proxy.ts copies the URL's locale into a request header, for server
// components that receive no `params` (not-found pages, the root layout).
export const getRequestLocale = async (): Promise<Locale> => {
  const value = (await headers()).get(LOCALE_HEADER)
  return value === 'id' ? 'id' : 'en'
}
