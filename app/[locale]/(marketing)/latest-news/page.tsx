import Link from 'next/link'
import { buttonVariants } from '@/components/reusable/Button'
import { getDictionary, type Locale } from '@/i18n/getDictionary'
import { latestNewsArticles } from '@/data/data'

type LatestNewsPageProps = {
  params: Promise<{ locale: string }>
}

const LatestNewsPage = async ({ params }: LatestNewsPageProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  const pageDict = dict.marketing.home.news

  return (
    <div>
      <section className="relative overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(254,226,81,0.28),_transparent_30%),linear-gradient(180deg,rgba(51,71,125,0.85),rgba(0,0,0,0.5))]" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-28 lg:px-20">
          <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 sm:text-sm">
            {pageDict.heading}
          </span>
          <h1 className="mt-8 max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
            {pageDict.heading}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            {pageDict.intro}
          </p>
        </div>
      </section>

      <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-3xl">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              {pageDict.heading}
            </h2>
            <p className="mt-4 text-base text-foreground/70">
              {pageDict.intro}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestNewsArticles.map((article) => (
              <article key={article.id} className="flex flex-col overflow-hidden rounded-sm border border-foreground/10 bg-white shadow-sm">
                <div className="aspect-video w-full bg-neutral-300" />
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {article.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-foreground/70">
                      {article.excerpt}
                    </p>
                  </div>
                  <div className="mt-auto">
                    <Link
                      href={article.href}
                      className={`${buttonVariants({ variant: 'yellow' })} inline-flex self-start`}
                    >
                      {pageDict.readCta}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LatestNewsPage
