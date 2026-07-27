'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { List, MagnifyingGlass, X } from '@phosphor-icons/react'
import LangToggle from '@/components/reusable/LangToggle'
import { navLinks } from '@/data/data'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

type NavbarProps = {
  currentLocale: Locale
  dict: Dictionary['marketing']['nav']
}

const Navbar = ({ currentLocale, dict }: NavbarProps) => {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-20">
        <Link href={`/${currentLocale}`} className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Indonesia Tanpa Polusi"
            width={36}
            height={36}
            className="rounded-full"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-navy lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={`/${currentLocale}${link.href}`}
              className="hover:opacity-70"
            >
              {dict[link.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <label className="flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1.5">
            <MagnifyingGlass size={16} className="text-foreground/50" />
            <input
              type="text"
              placeholder={dict.searchPlaceholder}
              className="w-32 bg-transparent text-sm outline-none placeholder:text-foreground/40"
            />
          </label>
          <LangToggle currentLocale={currentLocale} />
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 text-brand-navy lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-foreground/10 px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-4 text-sm font-medium text-brand-navy">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                href={`/${currentLocale}${link.href}`}
                onClick={() => setOpen(false)}
              >
                {dict[link.key]}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex items-center gap-3">
            <label className="flex flex-1 items-center gap-2 rounded-full border border-foreground/10 px-3 py-1.5">
              <MagnifyingGlass size={16} className="text-foreground/50" />
              <input
                type="text"
                placeholder={dict.searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
              />
            </label>
            <LangToggle currentLocale={currentLocale} />
          </div>
        </div>
      )}
    </header>
  )
}

export default Navbar
