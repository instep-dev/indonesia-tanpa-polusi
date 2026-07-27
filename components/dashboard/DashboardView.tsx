'use client'

import { authStore } from '@/services/auth/auth.store'

const DashboardView = () => {
  const user = authStore((s) => s.user)
  const bootstrapped = authStore((s) => s.bootstrapped)

  if (!bootstrapped) return null

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {user && <p className="mt-2 text-foreground/70">Signed in as {user.email}</p>}
    </div>
  )
}

export default DashboardView
