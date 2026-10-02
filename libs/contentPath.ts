const isContainer = (value: unknown): value is object => typeof value === 'object' && value !== null

const walk = (source: unknown, segments: string[]): unknown =>
  segments.reduce<unknown>((current, segment) => (isContainer(current) ? Reflect.get(current, segment) : undefined), source)

/** Reads `a.b.0.c` from nested objects/arrays. Returns undefined when any step is missing. */
export const getByPath = (source: unknown, path: string): unknown => walk(source, path.split('.'))

/** Overwrites an existing array of strings at `a.b.c` (used for multi-paragraph copy). Never creates a missing key. */
export const setStringArrayByPath = (target: unknown, path: string, value: string[]): boolean => {
  const segments = path.split('.')
  const last = segments.pop()
  if (!last) return false

  const parent = walk(target, segments)
  const current = isContainer(parent) ? Reflect.get(parent, last) : undefined
  if (!isContainer(parent) || !Array.isArray(current)) return false

  Reflect.set(parent, last, value)
  return true
}

/**
 * Overwrites the string at `a.b.0.c`. Only ever replaces an existing string, so
 * the shape of the target (arrays, nested objects) can never be altered by a
 * stray key. Returns whether a value was written.
 */
export const setStringByPath = (target: unknown, path: string, value: string): boolean => {
  const segments = path.split('.')
  const last = segments.pop()
  if (!last) return false

  const parent = walk(target, segments)
  if (!isContainer(parent) || typeof Reflect.get(parent, last) !== 'string') return false

  Reflect.set(parent, last, value)
  return true
}
