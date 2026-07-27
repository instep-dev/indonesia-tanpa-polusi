import Navbar from '@/components/marketing/Navbar'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

const MarketingLayout = ({
  children,
  locale,
  navDict,
}: {
  children: React.ReactNode
  locale: Locale
  navDict: Dictionary['marketing']['nav']
}) => (
  <main>
    <Navbar currentLocale={locale} dict={navDict} />
    {children}
  </main>
)

export default MarketingLayout
