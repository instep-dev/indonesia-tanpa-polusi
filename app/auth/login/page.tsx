'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { useLogin } from '@/services/auth/auth.queries'

const LoginPage = () => {
  const router = useRouter()
  const { mutate, isPending, error } = useLogin()

  const handleSubmit = (values: { email: string; password: string }) => {
    mutate(values, { onSuccess: () => router.push('/dashboard') })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <LoginForm
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error ? 'Invalid email or password' : undefined}
      />
      <p className="text-sm text-foreground/60">
        Belum punya akun?{' '}
        <Link href="/auth/register" className="underline">
          Daftar
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
