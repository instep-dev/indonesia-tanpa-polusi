import type { Metadata } from 'next'
import type { Locale } from '@/i18n/getDictionary'
import RegionPage from '@/components/marketing/RegionPage'
import { getPageMetadata, getSiteDictionary, getSiteValues, getStories } from '@/libs/siteContent'

type SulawesiPageProps = { params: Promise<{ locale: string }> }

export const generateMetadata = async ({ params }: SulawesiPageProps): Promise<Metadata> => {
  const { locale } = await params
  return getPageMetadata('sulawesi', locale === 'en' ? 'en' : 'id')
}

const SulawesiPage = async ({ params }: SulawesiPageProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const [dict, values, stories] = await Promise.all([
    getSiteDictionary(validLocale),
    getSiteValues(validLocale),
    getStories('stories.sulawesi', validLocale),
  ])

  return (
    <RegionPage
      currentLocale={validLocale}
      regionSlug="sulawesi"
      dict={dict.marketing.home.regions.sulawesi}
      newsListDict={dict.marketing.home.news}
      stories={stories}
      heroImage={values['media.regions.sulawesi.heroImage']}
      aboutImage={values['media.regions.sulawesi.aboutImage']}
    />
  )
}

export default SulawesiPage
