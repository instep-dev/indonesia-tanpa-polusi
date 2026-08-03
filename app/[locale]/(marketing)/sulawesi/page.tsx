import { getDictionary, type Locale } from '@/i18n/getDictionary'
import RegionPage from '@/components/marketing/RegionPage'
import { regionStories } from '@/data/data'

const SulawesiPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)

  return (
    <RegionPage
      currentLocale={validLocale}
      regionSlug="sulawesi"
      dict={dict.marketing.home.regions.sulawesi}
      newsListDict={dict.marketing.home.news}
      stories={regionStories.sulawesi}
    />
  )
}

export default SulawesiPage
