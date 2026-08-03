import JournalistsView from '@/components/dashboard/JournalistsView'

// Auth-gated, admin-only content — never statically prerender.
export const dynamic = 'force-dynamic'

const JournalistsPage = () => <JournalistsView />

export default JournalistsPage
