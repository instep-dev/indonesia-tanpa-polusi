import ContentIndexView from '@/components/dashboard/ContentIndexView'

// Auth-gated, admin-only content — never statically prerender.
export const dynamic = 'force-dynamic'

const ContentPage = () => <ContentIndexView />

export default ContentPage
