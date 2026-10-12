import bcrypt from 'bcryptjs'
import type { NextRequest } from 'next/server'
import { clearHits, isRateLimited, recordHit } from '@/libs/rateLimit'

const MAX_EMAIL_LENGTH = 254
const MAX_PASSWORD_LENGTH = 200

const LOGIN_ATTEMPTS = 10
const LOGIN_WINDOW_MS = 15 * 60 * 1000

export type Credentials = { email: string; password: string }

/** `{ email, password }` when both are non-empty strings of a sane size, otherwise null (→ answer 400). */
export const parseCredentials = (body: unknown): Credentials | null => {
  if (typeof body !== 'object' || body === null) return null
  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string') return null
  if (!email || !password || email.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) return null
  return { email, password }
}

const loginKey = (request: NextRequest, email: string): string => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  return `login:${ip}:${email.toLowerCase()}`
}

/**
 * True when this client has FAILED to log in as this email too often recently. Only
 * failures count (see `recordFailedLogin`), so signing in successfully many times never
 * locks anyone out. In-memory and per server instance (see libs/rateLimit.ts) — it slows
 * down password guessing, it is not a global guarantee.
 */
export const isLoginRateLimited = (request: NextRequest, email: string): boolean =>
  isRateLimited(loginKey(request, email), LOGIN_ATTEMPTS, LOGIN_WINDOW_MS)

/** Call after a wrong password / unknown account. */
export const recordFailedLogin = (request: NextRequest, email: string): void => recordHit(loginKey(request, email))

/** Call after a successful login, so earlier typos stop counting. */
export const clearFailedLogins = (request: NextRequest, email: string): void => clearHits(loginKey(request, email))

// A valid cost-12 bcrypt hash of a throwaway string (same cost as real passwords, see
// SALT_ROUNDS in the register route). Constant on purpose: generating one at runtime
// would make the first unknown-email login about twice as slow as every later one.
const TIMING_EQUALIZER_HASH = '$2b$12$sj4QEvxetaEDN8a/Wwp4aOfhAufzqEcamfr5EOxkc/4xgy7IDTSyS'

/**
 * bcrypt check that costs the same whether or not the account exists, so response
 * time does not reveal which emails are registered.
 */
export const verifyPassword = async (password: string, storedHash: string | null | undefined): Promise<boolean> => {
  if (storedHash) return bcrypt.compare(password, storedHash)
  await bcrypt.compare(password, TIMING_EQUALIZER_HASH)
  return false
}
