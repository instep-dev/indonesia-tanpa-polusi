'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'vibe-toast'
import { SignOut, Newspaper, Users } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useSuperAdminLogout } from '@/services/super-admin/super-admin-auth.queries'
import { useJournalists } from '@/services/user/user.queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const SuperAdminTopbar = () => {
  const router = useRouter()
  const superAdmin = superAdminAuthStore((s) => s.superAdmin)
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const logout = useSuperAdminLogout()
  const { data: journalists } = useJournalists(bootstrapped)
  const pendingCount = journalists?.filter((j) => !j.approvedAt).length ?? 0

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success('Signed out')
      router.push('/super-admin/auth/login')
    } catch {
      toast.error('Sign out failed')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/super-admin/dashboard" className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-[4px] bg-primary font-mono text-[10px] font-medium text-primary-foreground">
              ITP
            </span>
            <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Control Panel
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/super-admin/dashboard" />}>
              <Newspaper className="size-3.5" /> Articles
            </Button>
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/super-admin/journalists" />}
            >
              <Users className="size-3.5" /> Journalists
              {pendingCount > 0 && (
                <span className="ml-1 flex size-4 items-center justify-center rounded-full bg-[#FBF3DB] font-mono text-[9px] text-[#956400]">
                  {pendingCount}
                </span>
              )}
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {bootstrapped ? (
            superAdmin && (
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {superAdmin.email}
              </span>
            )
          ) : (
            <Skeleton className="hidden h-4 w-32 sm:block" />
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logout.isPending}>
            <SignOut className="size-3.5" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}

export default SuperAdminTopbar
