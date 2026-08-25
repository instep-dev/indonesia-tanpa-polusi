import { getDictionary, type Locale } from '@/i18n/getDictionary'
import Hero from '@/components/marketing/Hero'
import AboutUs from '@/components/reusable/AboutUs'
import OurStories from '@/components/reusable/OurStories'
import LatestNews from '@/components/marketing/LatestNews'
import { homeStoryCards } from '@/data/data'
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
      <Hero dict={homeDict} />
      <AboutUs dict={homeDict.about} />
      <OurStories dict={homeDict.ourStories} cards={homeStoryCards} />
      <LatestNews currentLocale={validLocale} dict={homeDict.news} articles={mappedArticles} />
    </div>
  )
}

export default Home
