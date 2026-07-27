import { getDictionary, type Locale } from '@/i18n/getDictionary'
import RegionPage from '@/components/marketing/RegionPage'
import { regionPages } from '@/data/data'

const KalimantanUtaraPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)

  return (
    <RegionPage
      currentLocale={validLocale}
      dict={dict.marketing.home.regions.kalimantanUtara}
      stories={regionPages.kalimantanUtara.stories}
      articles={regionPages.kalimantanUtara.articles}
    />
  )
}

export default KalimantanUtaraPage
