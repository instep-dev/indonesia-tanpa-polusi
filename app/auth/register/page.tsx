'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RegisterForm from '@/components/auth/RegisterForm'
import { useRegister } from '@/services/auth/auth.queries'

const RegisterPage = () => {
  const router = useRouter()
  const { mutate, isPending, error } = useRegister()

  const handleSubmit = (values: { email: string; password: string; name?: string }) => {
    mutate(values, { onSuccess: () => router.push('/auth/login') })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <RegisterForm
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error ? 'Pendaftaran gagal. Email mungkin sudah terdaftar.' : undefined}
      />
      <p className="text-sm text-foreground/60">
        Sudah punya akun?{' '}
        <Link href="/auth/login" className="underline">
          Masuk
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
