import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { RegionKey } from '@/data/data'
import type { StoryItem } from '@/libs/contentMerge'
import HeroRegion from './HeroRegion'
import AboutRegion from './AboutRegion'
import OurStories from '@/components/reusable/OurStories'
import LatestNewsList from './LatestNewsList'

const REGION_DB_SLUGS: Record<RegionKey, string> = {
  sulawesi: 'sulawesi',
  malukuUtara: 'maluku-utara',
  kalimantanUtara: 'kalimantan-utara',
}

type RegionPageProps = {
  currentLocale: Locale
  regionSlug: RegionKey
  dict: Dictionary['marketing']['home']['regions'][RegionKey]
  newsListDict: Dictionary['marketing']['home']['news']
  stories: StoryItem[]
  heroImage: string
  aboutImage: string
}

const RegionPage = ({
  currentLocale,
  regionSlug,
  dict,
  newsListDict,
  stories,
  heroImage,
  aboutImage,
}: RegionPageProps) => (
  <div>
    <HeroRegion dict={dict} image={heroImage} />
    <AboutRegion dict={dict.about} image={aboutImage} />
    <OurStories dict={dict.ourStories} cards={stories} />

    <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-3xl">
          <h2 className="text-3xl font-tilt-warp text-brand-navy sm:text-4xl">
            {dict.news.heading}
          </h2>
          <p className="mt-4 text-base text-foreground/70">
            {dict.news.intro}
          </p>
        </div>

        <LatestNewsList locale={currentLocale} dict={newsListDict} region={REGION_DB_SLUGS[regionSlug]} />
      </div>
    </section>
  </div>
)

export default RegionPage
