'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { List, MagnifyingGlass, X } from '@phosphor-icons/react'
import LangToggle from '@/components/reusable/LangToggle'
import { cn } from '@/libs/utils'
import { navLinks, type NavLinkKey } from '@/data/data'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

type NavbarProps = {
  currentLocale: Locale
  dict: Dictionary['marketing']['nav']
}

// Navbar sits fixed on top of every marketing page. While the page's hero
// section (id="hero-viewport") occupies the strip under the navbar, it
// renders white-on-transparent to sit on top of the hero photo/video. Once
// the hero scrolls past, it flips to navy-on-white so it stays readable
// against the plain white sections below.
const NAVBAR_HEIGHT = 96

const Navbar = ({ currentLocale, dict }: NavbarProps) => {
  const [open, setOpen] = useState(false)
  const [overHero, setOverHero] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const target = document.getElementById('hero-viewport')
    if (!target) {
      setOverHero(false)
      return
    }

    setOverHero(true)
    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      { rootMargin: `-${NAVBAR_HEIGHT}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [pathname])

  const isLinkActive = (key: NavLinkKey, href: string): boolean => {
    const target = `/${currentLocale}${href}`
    // Next doesn't add a trailing slash to the home route — /en, not /en/.
    if (href === '/') return pathname === `/${currentLocale}` || pathname === target
    // Both the list page and detail pages live under /news.
    if (key === 'latestNews' && pathname.startsWith(`/${currentLocale}/news`)) return true
    return pathname === target || pathname.startsWith(`${target}/`)
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
      <motion.div
        className="absolute inset-0 border-b border-foreground/10 bg-background shadow-sm"
        initial={false}
        animate={{ opacity: overHero ? 0 : 1, y: overHero ? -16 : 0 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
      />

      <div className="relative px-6 py-4 sm:px-10 lg:px-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href={`/${currentLocale}`} className="flex items-center gap-2">
            <Image
              src={overHero ? '/logo-white.png' : '/logo-blue.png'}
              alt="Indonesia Tanpa Polusi"
              width={143}
              height={48}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </Link>

          <nav
            className={cn(
              'hidden items-center gap-6 text-lg font-bold transition-colors lg:flex',
              overHero ? 'text-white' : 'text-brand-navy',
            )}
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.key, link.href)
              return (
                <Link
                  key={link.key}
                  href={`/${currentLocale}${link.href}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'underline-offset-4',
                    active
                      ? 'text-brand-yellow underline'
                      : 'hover:opacity-80',
                  )}
                >
                  {dict[link.key]}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              type="button"
              aria-label={dict.searchPlaceholder}
              className={cn(
                'rounded-lg p-2.5 backdrop-blur-sm transition-colors',
                overHero
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-brand-navy/10 text-brand-navy hover:bg-brand-navy/20',
              )}
            >
              <MagnifyingGlass size={18} />
            </button>
            <LangToggle currentLocale={currentLocale} />
            <Link
              href="/auth/login"
              className={cn(
                'rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors',
                overHero
                  ? 'bg-white/20 text-white backdrop-blur-sm hover:bg-white/30'
                  : 'bg-brand-navy text-white hover:bg-brand-navy/90',
              )}
            >
              {dict.login}
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className={cn('p-2 transition-colors lg:hidden', overHero ? 'text-white' : 'text-brand-navy')}
            aria-label="Toggle menu"
          >
            {open ? <X size={24} /> : <List size={24} />}
          </button>
        </div>

        {open && (
          <div className="mt-4 rounded-lg bg-brand-navy/90 px-6 py-4 backdrop-blur-sm sm:px-10 lg:hidden">
            <nav className="flex flex-col gap-4 text-lg font-bold text-white">
              {navLinks.map((link) => {
                const active = isLinkActive(link.key, link.href)
                return (
                  <Link
                    key={link.key}
                    href={`/${currentLocale}${link.href}`}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'underline-offset-4',
                      active ? 'text-brand-yellow underline' : undefined,
                    )}
                  >
                    {dict[link.key]}
                  </Link>
                )
              })}
            </nav>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                aria-label={dict.searchPlaceholder}
                className="rounded-lg bg-white/20 p-2.5 text-white transition-colors hover:bg-white/30"
              >
                <MagnifyingGlass size={18} />
              </button>
              <LangToggle currentLocale={currentLocale} />
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/30"
              >
                {dict.login}
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
