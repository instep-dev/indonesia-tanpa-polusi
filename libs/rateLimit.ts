// Tiny in-memory sliding-window limiter. Per server instance, which is plenty to
// stop one account from hammering the translation service; it is not a global quota.

const hits = new Map<string, number[]>()

// Keys are never removed otherwise, so a flood of distinct keys (e.g. random login
// emails) would grow the map forever. Past this size, forget keys idle for an hour.
const PRUNE_ABOVE_SIZE = 5000
const PRUNE_IDLE_MS = 60 * 60 * 1000

const pruneIdleKeys = (now: number): void => {
  for (const [key, times] of hits) {
    if (times.length === 0 || now - times[times.length - 1] > PRUNE_IDLE_MS) hits.delete(key)
  }
}

export const allowRequest = (key: string, limit: number, windowMs: number, now: number = Date.now()): boolean => {
  if (hits.size > PRUNE_ABOVE_SIZE) pruneIdleKeys(now)
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/** True when `key` already has `limit` or more hits inside the window. Counts nothing. */
export const isRateLimited = (key: string, limit: number, windowMs: number, now: number = Date.now()): boolean =>
  (hits.get(key) ?? []).filter((time) => now - time < windowMs).length >= limit

/** Counts one hit against `key` (use with `isRateLimited` to limit only some outcomes, e.g. failures). */
export const recordHit = (key: string, now: number = Date.now()): void => {
  if (hits.size > PRUNE_ABOVE_SIZE) pruneIdleKeys(now)
  hits.set(key, [...(hits.get(key) ?? []), now])
}

/** Forgets every hit for `key`. */
export const clearHits = (key: string): void => {
  hits.delete(key)
}

/** Test helper. */
export const resetRateLimits = (): void => hits.clear()
