import SuperAdminDashboardView from '@/components/dashboard/SuperAdminDashboardView'

// Auth-gated, user-specific content — never statically prerender.
export const dynamic = 'force-dynamic'

const SuperAdminDashboardPage = () => <SuperAdminDashboardView />

export default SuperAdminDashboardPage
