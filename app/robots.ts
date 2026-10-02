import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/libs/siteUrl'

// Public pages are open to crawlers; the API, journalist dashboard, admin panel
// and login pages are not.
const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard', '/super-admin', '/auth'] },
  sitemap: `${SITE_URL}/sitemap.xml`,
})

export default robots
