import NotFoundSection from '@/components/marketing/NotFoundSection'
import { getRequestLocale } from '@/libs/localeHeader'
import { getSiteDictionary } from '@/libs/siteContent'

// Shown when an article is missing, unpublished or removed.
const ArticleNotFound = async () => {
  const locale = await getRequestLocale()
  const { newsDetail } = (await getSiteDictionary(locale)).marketing

  return (
    <NotFoundSection
      title={newsDetail.notFoundTitle}
      body={newsDetail.notFoundBody}
      ctaLabel={newsDetail.backCta}
      ctaHref={`/${locale}/news`}
    />
  )
}

export default ArticleNotFound
