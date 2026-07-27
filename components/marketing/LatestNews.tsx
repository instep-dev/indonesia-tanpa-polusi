import Link from 'next/link'
import { buttonVariants } from '@/components/reusable/Button'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { NewsCardId } from '@/data/data'

type NewsCard = { id: NewsCardId; href: string }

const LatestNews = ({
  currentLocale,
  dict,
  items,
}: {
  currentLocale: Locale
  dict: Dictionary['marketing']['home']['news']
  items: NewsCard[]
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
        {items.map((item) => {
          const copy = dict.items[item.id]

          return (
            <div key={item.id} className="flex flex-col">
              <div className="aspect-video w-full bg-neutral-500" />
              <h3 className="mt-4 text-xl font-bold text-foreground">{copy.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{copy.excerpt}</p>
              <Link
                href={`/${currentLocale}${item.href}`}
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
