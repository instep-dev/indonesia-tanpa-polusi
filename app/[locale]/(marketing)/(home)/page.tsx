import type { Metadata } from 'next'
import type { Locale } from '@/i18n/getDictionary'
import Hero from '@/components/marketing/Hero'
import AboutUs from '@/components/reusable/AboutUs'
import OurStories from '@/components/reusable/OurStories'
import LatestNews from '@/components/marketing/LatestNews'
import { db } from '@/libs/db'
import { mapArticle, articleInclude } from '@/libs/mapArticle'
import { getPageMetadata, getSiteDictionary, getSiteValues, getStories } from '@/libs/siteContent'

type HomeProps = {
  params: Promise<{ locale: string }>
}

export const generateMetadata = async ({ params }: HomeProps): Promise<Metadata> => {
  const { locale } = await params
  return getPageMetadata('home', locale === 'en' ? 'en' : 'id')
}

const Home = async ({ params }: HomeProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const [dict, values, stories] = await Promise.all([
    getSiteDictionary(validLocale),
    getSiteValues(validLocale),
    getStories('stories.home', validLocale),
  ])
  const homeDict = dict.marketing.home

  // Query up to 3 main articles that are published and not deleted
  const mainArticles = await db.article.findMany({
    where: {
      isMain: true,
      status: 'PUBLISHED',
      deletedAt: null,
    },
    include: articleInclude,
    orderBy: { updatedAt: 'desc' },
    take: 3,
  })

  const mappedArticles = mainArticles.map(mapArticle)

  return (
    <div>
      <Hero
        dict={homeDict}
        videoSrc={values['media.home.hero.video']}
        ctaHref={values['media.home.hero.ctaHref']}
      />
      <AboutUs
        dict={homeDict.about}
        image={values['media.home.about.image']}
        ctaHref={values['media.home.about.ctaHref']}
      />
      <OurStories dict={homeDict.ourStories} cards={stories} />
      <LatestNews
        currentLocale={validLocale}
        dict={homeDict.news}
        articles={mappedArticles}
        fallbackCover={values['media.home.news.fallbackCover']}
      />
    </div>
  )
}

export default Home
