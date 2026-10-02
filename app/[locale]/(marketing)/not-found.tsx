import NotFoundSection from '@/components/marketing/NotFoundSection'
import { getRequestLocale } from '@/libs/localeHeader'
import { getSiteDictionary } from '@/libs/siteContent'

// Generic 404 for the public site. `not-found` files get no `params`, so the
// locale comes from the x-locale header set by proxy.ts.
const NotFound = async () => {
  const locale = await getRequestLocale()
  const { notFound } = (await getSiteDictionary(locale)).marketing

  return <NotFoundSection title={notFound.title} body={notFound.body} ctaLabel={notFound.backCta} ctaHref={`/${locale}`} />
}

export default NotFound
