'use client'

import { usePathname, useRouter } from 'next/navigation'
import { getLang } from '@/i18n/getLang'
import type { Locale } from '@/i18n/getDictionary'

const LOCALES: Locale[] = ['en', 'id']

const LangToggle = ({ currentLocale }: { currentLocale: Locale }) => {
  const pathname = usePathname()
  const router = useRouter()

  const nextLocale = LOCALES.find((l) => l !== currentLocale) ?? 'en'

  const handleSwitch = () => {
    const newPath = getLang(pathname, currentLocale, nextLocale)
    router.push(newPath)
  }

  return (
    <button
      onClick={handleSwitch}
      className="rounded-lg bg-brand-navy px-3 py-2.5 text-sm font-semibold uppercase text-white transition-colors hover:bg-brand-navy/90 cursor-pointer"
      aria-label={`Switch to ${nextLocale}`}
    >
      {currentLocale}
    </button>
  )
}

export default LangToggle
