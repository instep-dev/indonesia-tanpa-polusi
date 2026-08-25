'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'vibe-toast'
import { SignOut } from '@phosphor-icons/react'
import { authStore } from '@/services/auth/auth.store'
import { useLogout } from '@/services/auth/auth.queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const DashboardTopbar = () => {
  const router = useRouter()
  const user = authStore((s) => s.user)
  const bootstrapped = authStore((s) => s.bootstrapped)
  const logout = useLogout()

  const handleLogout = async () => {
    try {
      await logout.mutateAsync()
      toast.success('Signed out')
      router.push('/auth/login')
    } catch {
      toast.error('Sign out failed')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo-blue.png"
            alt="Indonesia Tanpa Polusi"
            width={143}
            height={48}
            className="h-10 w-auto sm:h-12"
            priority
          />
          <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Newsroom
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {bootstrapped ? (
            user && (
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {user.email}
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

export default DashboardTopbar
