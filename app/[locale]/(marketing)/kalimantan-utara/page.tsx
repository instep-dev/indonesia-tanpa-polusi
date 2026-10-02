import type { Metadata } from 'next'
import type { Locale } from '@/i18n/getDictionary'
import RegionPage from '@/components/marketing/RegionPage'
import { getPageMetadata, getSiteDictionary, getSiteValues, getStories } from '@/libs/siteContent'

type KalimantanUtaraPageProps = { params: Promise<{ locale: string }> }

export const generateMetadata = async ({ params }: KalimantanUtaraPageProps): Promise<Metadata> => {
  const { locale } = await params
  return getPageMetadata('kalimantanUtara', locale === 'en' ? 'en' : 'id')
}

const KalimantanUtaraPage = async ({ params }: KalimantanUtaraPageProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const [dict, values, stories] = await Promise.all([
    getSiteDictionary(validLocale),
    getSiteValues(validLocale),
    getStories('stories.kalimantanUtara', validLocale),
  ])

  return (
    <RegionPage
      currentLocale={validLocale}
      regionSlug="kalimantanUtara"
      dict={dict.marketing.home.regions.kalimantanUtara}
      newsListDict={dict.marketing.home.news}
      stories={stories}
      heroImage={values['media.regions.kalimantanUtara.heroImage']}
      aboutImage={values['media.regions.kalimantanUtara.aboutImage']}
    />
  )
}

export default KalimantanUtaraPage
