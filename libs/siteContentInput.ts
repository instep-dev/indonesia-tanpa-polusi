import { fieldsByKey } from '@/data/content-registry'
import { validateValue } from '@/libs/contentValidation'

export const MAX_FIELDS_PER_SAVE = 200

export type ParsedField = {
  key: string
  /** Trimmed values; empty string = "no override" (use the built-in default). */
  valueId: string
  valueEn: string
  /** Both values empty → resets the field to its built-in default. */
  reset: boolean
}

export type ParseFieldsResult = { ok: true; fields: ParsedField[] } | { ok: false; error: string }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** Validates `[{key, valueId, valueEn}]` against the content registry — shared by "publish" and "save draft". */
export const parseFieldEntries = (input: unknown): ParseFieldsResult => {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_FIELDS_PER_SAVE) {
    return { ok: false, error: `fields must be an array of 1-${MAX_FIELDS_PER_SAVE} entries` }
  }

  const fields: ParsedField[] = []
  for (const entry of input) {
    if (!isRecord(entry) || typeof entry.key !== 'string') return { ok: false, error: 'Each field needs a key' }
    const field = fieldsByKey.get(entry.key)
    if (!field) return { ok: false, error: `Unknown field: ${entry.key}` }

    const valueId = asText(entry.valueId)
    const valueEn = field.localized ? asText(entry.valueEn) : ''
    for (const value of [valueId, valueEn]) {
      const error = validateValue(field.type, value)
      if (error) return { ok: false, error: `${field.label}: ${error}` }
    }

    fields.push({ key: field.key, valueId, valueEn, reset: !valueId && !valueEn })
  }
  return { ok: true, fields }
}

/** Validates a list of field keys (e.g. drafts to clear). */
export const parseFieldKeys = (input: unknown): { ok: true; keys: string[] } | { ok: false; error: string } => {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_FIELDS_PER_SAVE) {
    return { ok: false, error: `keys must be an array of 1-${MAX_FIELDS_PER_SAVE} field keys` }
  }
  for (const key of input) {
    if (typeof key !== 'string' || !fieldsByKey.has(key)) return { ok: false, error: `Unknown field: ${String(key)}` }
  }
  return { ok: true, keys: input as string[] }
}
