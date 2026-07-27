import DashboardView from '@/components/dashboard/DashboardView'

// Auth-gated, user-specific content — never statically prerender.
export const dynamic = 'force-dynamic'

const DashboardPage = () => <DashboardView />

export default DashboardPage
