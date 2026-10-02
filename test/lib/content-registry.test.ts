import { allFields, contentPages, isValueField, valueDefaults } from '@/data/content-registry'
import { getDictionary } from '@/i18n/getDictionary'
import { getByPath } from '@/libs/contentPath'

describe('content registry', () => {
  it('has no duplicate field keys', () => {
    const keys = allFields.map((field) => field.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('has no duplicate page slugs or collection ids', () => {
    const slugs = contentPages.map((page) => page.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    const ids = contentPages.flatMap((page) => page.collections.map((c) => c.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(['en', 'id'] as const)('every message-backed field resolves to a string in %s.json', async (locale) => {
    const dict = await getDictionary(locale)
    const missing = allFields
      .filter((field) => !isValueField(field))
      .filter((field) => {
        const value = getByPath(dict, field.key)
        return field.type === 'paragraphs'
          ? !(Array.isArray(value) && value.every((item) => typeof item === 'string'))
          : typeof value !== 'string'
      })
      .map((field) => field.key)
    expect(missing).toEqual([])
  })

  it('every value field has a built-in default', () => {
    for (const field of allFields.filter(isValueField)) {
      expect(Object.hasOwn(valueDefaults, field.key)).toBe(true)
    }
  })

  it('exposes every value default in the editor', () => {
    const exposed = new Set(allFields.map((field) => field.key))
    const orphaned = Object.keys(valueDefaults).filter((key) => !exposed.has(key))
    expect(orphaned).toEqual([])
  })
})
