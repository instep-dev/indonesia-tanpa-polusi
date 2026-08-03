import Link from 'next/link'
import { buttonVariants } from '@/components/reusable/Button'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { NewsCardId } from '@/data/data'
import type { ArticleDto } from '@/services/article/article.dto'

type RegionNewsItem = {
  id: NewsCardId
  href: string
  article: ArticleDto | null
}

const LatestNews = ({
  currentLocale,
  dict,
  items,
}: {
  currentLocale: Locale
  dict: Dictionary['marketing']['home']['news']
  items: RegionNewsItem[]
}) => (
  <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
          {dict.heading}
        </h2>
        <Link
          href={`/${currentLocale}/latest-news`}
          className={buttonVariants({ variant: 'yellow' })}
        >
          {dict.viewAllCta}
        </Link>
      </div>

      <p className="mt-4 max-w-2xl text-base text-foreground/70">{dict.intro}</p>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ id, href, article }) => {
          const fallback = dict.items[id]
          const title = article ? (currentLocale === 'id' ? article.titleId : article.titleEn) : fallback.title
          const excerpt = article
            ? currentLocale === 'id' ? article.excerptId : article.excerptEn
            : fallback.excerpt
          const linkHref = article ? `/${currentLocale}/news/${article.slug}` : `/${currentLocale}${href}`

          return (
            <div key={id} className="flex flex-col">
              <div
                className="aspect-video w-full bg-neutral-500 bg-cover bg-center"
                style={article?.coverImage ? { backgroundImage: `url(${article.coverImage})` } : undefined}
              />
              <h3 className="mt-4 text-xl font-bold text-foreground">{title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-foreground/70">{excerpt}</p>
              <Link
                href={linkHref}
                className={`${buttonVariants({ variant: 'yellow' })} mt-4 self-start`}
              >
                {dict.readCta}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)

export default LatestNews
