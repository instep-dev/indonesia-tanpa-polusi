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
      className="p-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors text-sm font-medium uppercase"
      aria-label={`Switch to ${nextLocale}`}
    >
      {currentLocale}
    </button>
  )
}

export default LangToggle
