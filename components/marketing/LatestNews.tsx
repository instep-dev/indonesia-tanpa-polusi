import Link from 'next/link'
import Image from 'next/image'
import { buttonVariants } from '@/components/reusable/Button'
import { homeNewsCards } from '@/data/data'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

const LatestNews = ({
  currentLocale,
  dict,
}: {
  currentLocale: Locale
  dict: Dictionary['marketing']['home']['news']
}) => (
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
        {homeNewsCards.map(({ id, href, image }) => {
          const copy = dict.items[id]

          return (
            <div key={id} className="flex flex-col">
              <div className="rounded-sm border-1 shadow-md/20">
                <div className="relative aspect-video w-full overflow-hidden rounded-sm">
                  <Image
                    src={image}
                    alt={copy.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <span className="mt-3 block text-xs font-medium uppercase tracking-wide text-foreground/50">
                    {copy.source}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-foreground">{copy.title}</h3>
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

export default LatestNews
