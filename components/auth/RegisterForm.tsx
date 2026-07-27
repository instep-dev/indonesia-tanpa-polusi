'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from '@/components/reusable/Button'

type RegisterFormProps = {
  onSubmit: (values: { email: string; password: string; name?: string }) => void
  isPending: boolean
  error?: string
}

const RegisterForm = ({ onSubmit, isPending, error }: RegisterFormProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password, name: name || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <input
        type="text"
        placeholder="Nama (opsional)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-foreground/20 bg-transparent px-4 py-2 text-sm"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="rounded-lg border border-foreground/20 bg-transparent px-4 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        className="rounded-lg border border-foreground/20 bg-transparent px-4 py-2 text-sm"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button variant="primary" type="submit" disabled={isPending}>
        {isPending ? 'Mendaftar...' : 'Daftar'}
      </Button>
    </form>
  )
}

export default RegisterForm
