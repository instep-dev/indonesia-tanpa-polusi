'use client'

import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { useSuperAdminLogin } from '@/services/super-admin/super-admin-auth.queries'

const SuperAdminLoginPage = () => {
  const router = useRouter()
  const { mutate, isPending, error } = useSuperAdminLogin()

  const handleSubmit = (values: { email: string; password: string }) => {
    mutate(values, { onSuccess: () => router.push('/super-admin/dashboard') })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm
        onSubmit={handleSubmit}
        isPending={isPending}
        error={error ? 'Invalid email or password' : undefined}
      />
    </div>
  )
}

export default SuperAdminLoginPage
