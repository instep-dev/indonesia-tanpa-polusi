'use client'

import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'

const SuperAdminDashboardView = () => {
  const superAdmin = superAdminAuthStore((s) => s.superAdmin)
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)

  if (!bootstrapped) return null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Super Admin Dashboard</h1>
      {superAdmin && <p className="mt-2 text-foreground/70">Signed in as {superAdmin.email}</p>}
    </div>
  )
}

export default SuperAdminDashboardView
