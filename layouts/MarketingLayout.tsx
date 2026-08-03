import Navbar from '@/components/reusable/Navbar'
import ContactUs from '@/components/reusable/ContactUs'
import { contactInfo } from '@/data/data'
import type { Dictionary, Locale } from '@/i18n/getDictionary'

const MarketingLayout = ({
  children,
  locale,
  navDict,
  contactDict,
}: {
  children: React.ReactNode
  locale: Locale
  navDict: Dictionary['marketing']['nav']
  contactDict: Dictionary['marketing']['home']['contact']
}) => (
  <main>
    <Navbar currentLocale={locale} dict={navDict} />
    {children}
    <ContactUs dict={contactDict} contact={contactInfo} />
  </main>
)

export default MarketingLayout
