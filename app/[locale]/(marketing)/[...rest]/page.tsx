import { notFound } from 'next/navigation'

// Catch-all for unknown URLs under a locale (/en/typo). Without it Next falls
// back to the root, unstyled English-only 404; this renders the CMS-managed
// 404 inside the localized layout instead.
const UnknownPage = () => notFound()

export default UnknownPage
