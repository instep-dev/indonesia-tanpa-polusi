import { getDictionary, type Locale } from '@/i18n/getDictionary'
import Hero from '@/components/marketing/Hero'
import AboutUs from '@/components/reusable/AboutUs'
import OurStories from '@/components/reusable/OurStories'
import LatestNews from '@/components/marketing/LatestNews'
import { homeStoryCards, homeNewsCards } from '@/data/data'
import { db } from '@/libs/db'
import { mapArticle, articleInclude } from '@/libs/mapArticle'

const Home = async ({
  params,
}: {
  params: Promise<{ locale: string }>
}) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  const homeDict = dict.marketing.home

  const newsItems = await Promise.all(
    homeNewsCards.map(async (card) => {
      const record = await db.article.findFirst({
        where: { status: 'PUBLISHED', deletedAt: null, region: { slug: card.id } },
        include: articleInclude,
        orderBy: { publishedAt: 'desc' },
      })
      return { id: card.id, href: card.href, article: record ? mapArticle(record) : null }
    }),
  )

  return (
    <div>
      <Hero dict={homeDict} />
      <AboutUs dict={homeDict.about} />
      <OurStories dict={homeDict.ourStories} cards={homeStoryCards} />
      <LatestNews currentLocale={validLocale} dict={homeDict.news} items={newsItems} />
    </div>
  )
}

export default Home
