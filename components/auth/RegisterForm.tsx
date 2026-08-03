'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { User, Envelope, LockSimple, Eye, EyeSlash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type RegisterFormProps = {
  onSubmit: (values: { email: string; password: string; name?: string }) => void
  isPending: boolean
}

const RegisterForm = ({ onSubmit, isPending }: RegisterFormProps) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password, name: name || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Optional"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Envelope className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@indonesiatanpapolusi.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockSimple className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="h-10 px-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeSlash className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="mt-1 h-10 w-full">
        {isPending ? 'Mendaftar...' : 'Daftar'}
      </Button>
    </form>
  )
}

export default RegisterForm
