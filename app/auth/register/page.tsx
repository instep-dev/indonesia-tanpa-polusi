'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'vibe-toast'
import RegisterForm from '@/components/auth/RegisterForm'
import { useRegister } from '@/services/auth/auth.queries'
import { Card, CardContent } from '@/components/ui/card'

const RegisterPage = () => {
  const router = useRouter()
  const { mutate, isPending } = useRegister()

  const handleSubmit = (values: { email: string; password: string; name?: string }) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Account created — please sign in')
        router.push('/auth/login')
      },
      onError: () => {
        toast.error('Registration failed. Email may already be in use.')
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
          <span className="flex size-9 items-center justify-center rounded-[6px] bg-primary font-mono text-xs font-medium text-primary-foreground">
            ITP
          </span>
          <p className="mt-4 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Newsroom
          </p>
          <h1 className="mt-1.5 font-editorial text-4xl tracking-tight text-foreground">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">Join the newsroom to start publishing.</p>
        </div>

        <Card>
          <CardContent>
            <RegisterForm onSubmit={handleSubmit} isPending={isPending} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
