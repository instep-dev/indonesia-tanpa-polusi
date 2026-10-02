import Navbar from '@/components/reusable/Navbar'
import ContactUs from '@/components/reusable/ContactUs'
import type { Dictionary, Locale } from '@/i18n/getDictionary'
import type { ContactCollage, NavLogos, SocialItem } from '@/libs/contentMerge'

const MarketingLayout = ({
  children,
  locale,
  navDict,
  contactDict,
  logos,
  contact,
}: {
  children: React.ReactNode
  locale: Locale
  navDict: Dictionary['marketing']['nav']
  contactDict: Dictionary['marketing']['home']['contact']
  logos: NavLogos
  contact: { email: string; socials: SocialItem[]; collage: ContactCollage }
}) => (
  <main className="relative">
    <Navbar currentLocale={locale} dict={navDict} logos={logos} />
    {children}
    <ContactUs dict={contactDict} contact={contact} />
  </main>
)

export default MarketingLayout
