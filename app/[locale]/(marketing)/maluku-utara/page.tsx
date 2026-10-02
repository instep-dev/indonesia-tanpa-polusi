import type { Metadata } from 'next'
import type { Locale } from '@/i18n/getDictionary'
import RegionPage from '@/components/marketing/RegionPage'
import { getPageMetadata, getSiteDictionary, getSiteValues, getStories } from '@/libs/siteContent'

type MalukuUtaraPageProps = { params: Promise<{ locale: string }> }

export const generateMetadata = async ({ params }: MalukuUtaraPageProps): Promise<Metadata> => {
  const { locale } = await params
  return getPageMetadata('malukuUtara', locale === 'en' ? 'en' : 'id')
}

const MalukuUtaraPage = async ({ params }: MalukuUtaraPageProps) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const [dict, values, stories] = await Promise.all([
    getSiteDictionary(validLocale),
    getSiteValues(validLocale),
    getStories('stories.malukuUtara', validLocale),
  ])

  return (
    <RegionPage
      currentLocale={validLocale}
      regionSlug="malukuUtara"
      dict={dict.marketing.home.regions.malukuUtara}
      newsListDict={dict.marketing.home.news}
      stories={stories}
      heroImage={values['media.regions.malukuUtara.heroImage']}
      aboutImage={values['media.regions.malukuUtara.aboutImage']}
    />
  )
}

export default MalukuUtaraPage
