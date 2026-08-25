'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'vibe-toast'
import LoginForm from '@/components/auth/LoginForm'
import { useSuperAdminLogin } from '@/services/super-admin/super-admin-auth.queries'
import { Card, CardContent } from '@/components/ui/card'

const SuperAdminLoginPage = () => {
  const router = useRouter()
  const { mutate, isPending } = useSuperAdminLogin()

  const handleSubmit = (values: { email: string; password: string }) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Signed in successfully')
        router.push('/super-admin/dashboard')
      },
      onError: () => {
        toast.error('Invalid email or password')
      },
    })
  }

  return (
    <div className="workspace-canvas relative flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(17,17,17,0.05),transparent)]"
      />

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 relative w-full max-w-sm duration-500">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-blue.png"
            alt="Indonesia Tanpa Polusi"
            width={143}
            height={48}
            className="h-10 w-auto sm:h-12"
            priority
          />
          <p className="mt-4 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Control Panel
          </p>
          <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground">Super Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to review and publish articles.</p>
        </div>

        <Card>
          <CardContent>
            <LoginForm onSubmit={handleSubmit} isPending={isPending} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SuperAdminLoginPage
