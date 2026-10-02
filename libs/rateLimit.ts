// Tiny in-memory sliding-window limiter. Per server instance, which is plenty to
// stop one account from hammering the translation service; it is not a global quota.

const hits = new Map<string, number[]>()

export const allowRequest = (key: string, limit: number, windowMs: number, now: number = Date.now()): boolean => {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  return true
}

/** Test helper. */
export const resetRateLimits = (): void => hits.clear()
