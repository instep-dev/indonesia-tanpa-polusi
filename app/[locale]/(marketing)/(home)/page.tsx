import { getDictionary, type Locale } from '@/i18n/getDictionary'
import Hero from '@/components/marketing/Hero'
import AboutUs from '@/components/reusable/AboutUs'
import OurStories from '@/components/reusable/OurStories'
import LatestNews from '@/components/marketing/LatestNews'
import { homeStoryCards } from '@/data/data'

const Home = async ({
  params,
}: {
  params: Promise<{ locale: string }>
}) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  const homeDict = dict.marketing.home

  return (
    <div>
      <Hero dict={homeDict} />
      <AboutUs dict={homeDict.about} />
      <OurStories dict={homeDict.ourStories} cards={homeStoryCards} />
      <LatestNews currentLocale={validLocale} dict={homeDict.news} />
    </div>
  )
}

export default Home
