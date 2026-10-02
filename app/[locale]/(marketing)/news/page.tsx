import type { Metadata } from 'next'
import type { Locale } from '@/i18n/getDictionary'
import { getPageMetadata, getSiteDictionary, getSiteValues } from '@/libs/siteContent'
import HeroLatestNews from '@/components/marketing/HeroLatestNews'
import LatestNewsList from '@/components/marketing/LatestNewsList'

type NewsPageProps = {
  params: Promise<{ locale: string }>
}

export const generateMetadata = async ({ params }: NewsPageProps): Promise<Metadata> => {
  const { locale } = await params
  return getPageMetadata('news', locale === 'en' ? 'en' : 'id')
}

const NewsPage = async ({ params }: NewsPageProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const [dict, values] = await Promise.all([getSiteDictionary(validLocale), getSiteValues(validLocale)])
  const pageDict = dict.marketing.home.news

  return (
    <div>
      <HeroLatestNews dict={dict.marketing.latestNews} image={values['media.latestNews.heroImage']} />

      <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-4xl">
            <h2 className="text-3xl font-tilt-warp text-foreground sm:text-4xl">
              {pageDict.heading}
            </h2>
            <p className="mt-4 text-base text-foreground/70">
              {pageDict.intro}
            </p>
          </div>

          <LatestNewsList locale={validLocale} dict={pageDict} />
        </div>
      </section>
    </div>
  )
}

export default NewsPage
