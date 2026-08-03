'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import { buttonVariants } from '@/components/reusable/Button'
import { usePublishedArticles } from '@/services/article/article.queries'
import { usePublicArticlesStream } from '@/services/article/article.sse'
import type { Locale } from '@/i18n/getDictionary'

type LatestNewsListDict = {
  searchPlaceholder: string
  loading: string
  loadingMore: string
  empty: string
  noResults: string
  error: string
  retry: string
  readCta: string
}

const SEARCH_DEBOUNCE_MS = 400

const LatestNewsList = ({
  locale,
  dict,
  region,
}: {
  locale: Locale
  dict: LatestNewsListDict
  region?: string
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublishedArticles({ region, search: search || undefined })

  usePublicArticlesStream(true)

  const articles = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage()
        }
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div>
      <div className="relative max-w-md">
        <MagnifyingGlass
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={dict.searchPlaceholder}
          className="w-full rounded-lg border border-foreground/15 bg-white py-2.5 pl-11 pr-4 text-sm text-foreground outline-none focus:border-foreground/30"
        />
      </div>

      {isPending && (
        <p className="mt-10 text-sm text-foreground/60">{dict.loading}</p>
      )}

      {isError && !isPending && (
        <div className="mt-10 flex items-center gap-4">
          <p className="text-sm text-red-600">{dict.error}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className={buttonVariants({ variant: 'white' })}
          >
            {dict.retry}
          </button>
        </div>
      )}

      {!isPending && !isError && articles.length === 0 && (
        <p className="mt-10 text-sm text-foreground/60">
          {search ? dict.noResults : dict.empty}
        </p>
      )}

      {!isPending && !isError && articles.length > 0 && (
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const title = locale === 'id' ? article.titleId : article.titleEn
            const excerpt = locale === 'id' ? article.excerptId : article.excerptEn

            return (
              <article key={article.id} className="flex flex-col">
                <div
                  className="aspect-video w-full bg-neutral-500 bg-cover bg-center"
                  style={article.coverImage ? { backgroundImage: `url(${article.coverImage})` } : undefined}
                />
                <div className="mt-4 flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-foreground">{title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{excerpt}</p>
                  <Link
                    href={`/${locale}/news/${article.slug}`}
                    className={`${buttonVariants({ variant: 'yellow' })} mt-4 self-start`}
                  >
                    {dict.readCta}
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <p className="mt-6 text-center text-sm text-foreground/60">{dict.loadingMore}</p>
      )}
    </div>
  )
}

export default LatestNewsList
