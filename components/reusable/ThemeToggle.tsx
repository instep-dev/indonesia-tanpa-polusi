'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Moon, Sun } from '@phosphor-icons/react'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration-mismatch guard, not a data sync effect
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === 'dark'
  const next = isDark ? 'light' : 'dark'

  const handleToggle = () => {
    // Signal direction BEFORE transition so CSS selector can read it immediately
    document.documentElement.setAttribute('data-theme-next', next)

    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> }
    }

    if (!doc.startViewTransition) {
      setTheme(next)
      document.documentElement.removeAttribute('data-theme-next')
      return
    }

    // Called as doc.startViewTransition(...) — a detached reference would
    // lose the `this` binding native DOM methods require and throw
    // "Illegal invocation".
    const vt = doc.startViewTransition(() => setTheme(next))

    vt.finished.then(() =>
      document.documentElement.removeAttribute('data-theme-next')
    )
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export default ThemeToggle
