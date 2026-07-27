import Link from 'next/link'
import { buttonVariants } from '@/components/reusable/Button'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { RegionKey, RegionArticle, RegionStoryCard } from '@/data/data'

type RegionPageProps = {
  currentLocale: Locale
  dict: Dictionary['marketing']['home']['regions'][RegionKey]
  stories: RegionStoryCard[]
  articles: RegionArticle[]
}

const RegionPage = ({ currentLocale, dict, stories, articles }: RegionPageProps) => (
  <div>
    <section className="relative overflow-hidden bg-neutral-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(254,226,81,0.28),_transparent_30%),linear-gradient(180deg,rgba(51,71,125,0.85),rgba(0,0,0,0.55))]" />
      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:px-10 sm:py-28 lg:px-20">
        <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 sm:text-sm">
          {dict.heroLabel}
        </span>
        <h1 className="mt-8 max-w-3xl text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
          {dict.heroTitle}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
          {dict.heroSubtitle}
        </p>
      </div>
    </section>

    <section className="bg-brand-yellow px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
            {dict.overviewHeading}
          </h2>
          <p className="mt-6 text-base text-brand-navy sm:text-lg">
            {dict.overviewText}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {stories.map((story) => (
            <div key={story.id} className="overflow-hidden rounded-sm bg-white shadow-sm">
              <div className="aspect-[4/3] bg-neutral-500" />
              <div className="flex flex-col justify-between bg-brand-navy p-5 text-white">
                <p className="text-sm leading-6 sm:text-base">“{story.quote}”</p>
                <p className="mt-4 font-bold text-brand-yellow">{story.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
              {dict.articleHeading}
            </h2>
            <p className="mt-4 max-w-2xl text-base text-foreground/70">
              {dict.articleIntro}
            </p>
          </div>
          <Link href={`/${currentLocale}/latest-news`} className={buttonVariants({ variant: 'yellow' })}>
            {dict.readCta}
          </Link>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="flex flex-col overflow-hidden rounded-sm border border-foreground/10 bg-white shadow-sm">
              <div className="aspect-[4/3] bg-neutral-300" />
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{article.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">{article.excerpt}</p>
                </div>
                <div className="mt-auto">
                  <Link
                    href={`/${currentLocale}${article.href}`}
                    className={`${buttonVariants({ variant: 'yellow' })} inline-flex self-start`}
                  >
                    {dict.readCta}
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

export default RegionPage
