'use client'

import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import { contentPages } from '@/data/content-registry'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const ContentIndexView = () => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  if (!bootstrapped) return null

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Website</p>
        <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
          Content
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Edit the text, images, logos and links of the public website, in Indonesian and English. Anything you
          don&apos;t change keeps its built-in value. News articles are managed under Articles.
        </p>
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-10 grid gap-4 duration-700 sm:grid-cols-2 lg:grid-cols-3">
        {contentPages.map((page) => {
          const fieldCount = page.sections.reduce((total, section) => total + section.fields.length, 0)
          const listCount = page.collections.length
          return (
            <Link key={page.slug} href={`/super-admin/content/${page.slug}`} className="group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    {page.title}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardTitle>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-[11px] tracking-[0.06em] text-muted-foreground uppercase">
                    {fieldCount} fields
                    {listCount > 0 && ` · ${listCount} list${listCount > 1 ? 's' : ''}`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default ContentIndexView
