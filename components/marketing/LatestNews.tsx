import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/reusable/Button'
import { homeNewsCards } from '@/data/data'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

import type { ArticleDto } from '@/services/article/article.dto'

const LatestNews = ({
  currentLocale,
  dict,
  articles,
}: {
  currentLocale: Locale
  dict: Dictionary['marketing']['home']['news']
  articles: ArticleDto[]
}) => {
  if (articles.length === 0) return null

  return (
    <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-3xl font-tilt-warp text-brand-navy sm:text-4xl">
            {dict.heading}
          </h2>
          <Link
            href={`/${currentLocale}/news`}
            className={buttonVariants({ variant: 'yellow' })}
          >
            {dict.viewAllCta}
          </Link>
        </div>

        <p className="mt-4 max-w-2xl text-base text-foreground/70">{dict.intro}</p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => {
            const title = currentLocale === 'id' ? article.titleId : article.titleEn
            const image = article.coverImage || '/news1.jpg'
            const source = article.region
              ? (currentLocale === 'id' ? article.region.nameId : article.region.nameEn)
              : (currentLocale === 'id' ? 'ARTIKEL UMUM' : 'GENERAL ARTICLE')
            const href = `/news/${article.slug}`

            return (
              <div key={article.id} className="flex flex-col">
                <div className="rounded-sm border-1 shadow-md/20">
                  <div className="relative aspect-video w-full overflow-hidden rounded-sm">
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <span className="mt-3 block text-xs font-medium uppercase tracking-wide text-foreground/50">
                      {source}
                    </span>
                    <h3 className="mt-1 text-xl font-bold text-foreground line-clamp-2">{title}</h3>
                  </div>
                  <Link
                    href={`/${currentLocale}${href}`}
                    className={`${buttonVariants({ variant: 'yellow' })} mt-4 self-start`}
                  >
                    {dict.readCta}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default LatestNews
