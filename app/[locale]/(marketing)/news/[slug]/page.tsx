import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Aperture, HourglassMedium, Stack } from '@phosphor-icons/react/dist/ssr'
import { getDictionary, type Locale } from '@/i18n/getDictionary'
import { db } from '@/libs/db'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import ArticleContentPreview from '@/components/dashboard/ArticleContentPreview'
import { cn } from '@/libs/utils'

type NewsDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>
}

// This route queries Prisma directly with no generateStaticParams — without
// this, Next.js's Full Route Cache serves whatever HTML was rendered on the
// very first visit indefinitely, so edits made after that (e.g. adding a
// cover image after publishing) never show up on the public page.
export const dynamic = 'force-dynamic'

const cardIcons = [Stack, HourglassMedium, Aperture]

const NewsDetailPage = async ({ params }: NewsDetailPageProps) => {
  const { locale, slug } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  const { newsDetail } = dict.marketing

  const record = await db.article.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: articleInclude,
  })
  if (!record) notFound()

  const article = mapArticle(record)
  const title = validLocale === 'id' ? article.titleId : article.titleEn
  const excerpt = validLocale === 'id' ? article.excerptId : article.excerptEn
  const content = validLocale === 'id' ? article.contentId : article.contentEn

  const cards = [
    { ...newsDetail.about.cards[0], url: article.reportUrl, Icon: Stack },
    { ...newsDetail.about.cards[1], url: article.pressReleaseUrl, Icon: HourglassMedium },
    { ...newsDetail.about.cards[2], url: article.visualUrl, Icon: Aperture },
  ].filter((c): c is typeof c & { url: string } => !!c.url)

  return (
    <div>
      <section id="hero-viewport" className="relative flex h-screen w-full flex-col overflow-hidden bg-neutral-500">
        {article.coverImage && (
          <Image
            src={article.coverImage}
            alt={title}
            fill
            priority
            sizes="100vw"
            className=" absolute inset-0 w-full h-full object-cover"
          />
        )}


        <div className="mt-auto bg-[#33477d]/85 px-6 py-10 sm:px-10 sm:py-12 lg:px-20 lg:py-16 z-20">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-extrabold leading-tight text-brand-yellow sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-4xl text-base text-white sm:text-2xl">{excerpt}</p>
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <ArticleContentPreview content={content} />
        </div>
      </section>

      {cards.length > 0 && (
        <section className="bg-slate-100 px-6 py-16 sm:px-10 lg:px-20">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-extrabold text-brand-navy sm:text-2xl">
                {newsDetail.about.heading}
              </h2>
              <p className="max-w-full text-sm text-brand-navy/70 sm:text-base">
                {newsDetail.about.description}
              </p>
            </div>

            <div
              className={cn(
                'mt-10 grid gap-6',
                cards.length === 1
                  ? 'sm:grid-cols-1 max-w-md mx-auto'
                  : cards.length === 2
                    ? 'sm:grid-cols-2 max-w-2xl mx-auto'
                    : 'sm:grid-cols-3',
              )}
            >
              {cards.map((card) => {
                const Icon = card.Icon
                return (
                  <div key={card.title} className="flex flex-col rounded-sm bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Icon size={24} weight="duotone" className="text-[#4E88C9] shrink-0" />
                      <h3 className="text-lg font-bold text-brand-navy">{card.title}</h3>
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-6 text-brand-navy/70">
                      {card.description}
                    </p>
                    <a
                      href={card.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full rounded-md bg-neutral-200 px-4 py-2 text-center text-sm font-bold text-brand-navy hover:bg-neutral-300 transition-colors"
                    >
                      {card.cta}
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default NewsDetailPage
