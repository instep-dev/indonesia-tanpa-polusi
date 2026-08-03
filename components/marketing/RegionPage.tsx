import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { RegionKey, RegionStoryCard } from '@/data/data'
import HeroRegion from './HeroRegion'
import OurStories from '@/components/reusable/OurStories'
import LatestNewsList from './LatestNewsList'

type RegionPageProps = {
  currentLocale: Locale
  regionSlug: RegionKey
  dict: Dictionary['marketing']['home']['regions'][RegionKey]
  newsListDict: Dictionary['marketing']['home']['news']
  stories: RegionStoryCard[]
}

const RegionPage = ({ currentLocale, regionSlug, dict, newsListDict, stories }: RegionPageProps) => (
  <div>
    <HeroRegion dict={dict} />
    <OurStories dict={dict.ourStories} cards={stories} />

    <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            {dict.news.heading}
          </h2>
          <p className="mt-4 text-base text-foreground/70">
            {dict.news.intro}
          </p>
        </div>

        <LatestNewsList locale={currentLocale} dict={newsListDict} region={regionSlug} />
      </div>
    </section>
  </div>
)

export default RegionPage
