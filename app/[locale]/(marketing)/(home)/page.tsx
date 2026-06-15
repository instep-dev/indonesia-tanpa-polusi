import { getDictionary, type Locale } from '@/i18n/getDictionary'
import Hero from '@/components/marketing/Hero'

const Home = async ({
  params,
}: {
  params: Promise<{ locale: string }>
}) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  const dictData = dict.marketing.home

  return (
    <div>
      <Hero dict={dictData} />
    </div>
  )
}

export default Home