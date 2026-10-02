import { ACTION_LABELS, diffText, isRestorable, snapshotText } from '@/libs/revisionText'
import { timeAgo } from '@/libs/timeAgo'

describe('snapshotText', () => {
  it('describes each kind of snapshot', () => {
    expect(snapshotText({ kind: 'field', snapshot: { valueId: 'Halo', valueEn: 'Hello' } })).toBe('ID: Halo\nEN: Hello')
    expect(snapshotText({ kind: 'field', snapshot: { valueId: null, valueEn: null } })).toBe('(built-in default)')
    expect(snapshotText({ kind: 'region', snapshot: { nameId: 'Sulawesi', nameEn: 'Sulawesi' } })).toBe('ID: Sulawesi\nEN: Sulawesi')
    expect(
      snapshotText({ kind: 'item', snapshot: { data: { name: 'Parker', quote: { id: 'Halo', en: 'Hello' } }, order: 0, deleted: true } }),
    ).toBe('(removed)\nname: Parker\nquote (ID): Halo\nquote (EN): Hello')
  })

  it('never throws on a malformed snapshot', () => {
    expect(snapshotText({ kind: 'field', snapshot: { nonsense: 1 } })).toBe('')
    expect(snapshotText({ kind: 'item', snapshot: null })).toBe('')
  })
})

describe('diffText', () => {
  it('marks added and removed words', () => {
    const parts = diffText('ID: Judul lama', 'ID: Judul baru')
    expect(parts.filter((part) => part.removed).map((part) => part.text.trim())).toEqual(['lama'])
    expect(parts.filter((part) => part.added).map((part) => part.text.trim())).toEqual(['baru'])
  })

  it('treats the first revision as all additions', () => {
    const parts = diffText('', 'ID: Halo')
    expect(parts.every((part) => part.added)).toBe(true)
  })
})

describe('isRestorable', () => {
  it('allows fields, items and regions that were published; not re-orderings or drafts', () => {
    expect(isRestorable({ kind: 'field', status: 'PUBLISHED' })).toBe(true)
    expect(isRestorable({ kind: 'item', status: 'PUBLISHED' })).toBe(true)
    expect(isRestorable({ kind: 'region', status: 'PUBLISHED' })).toBe(true)
    expect(isRestorable({ kind: 'collection', status: 'PUBLISHED' })).toBe(false)
    expect(isRestorable({ kind: 'field', status: 'DRAFT' })).toBe(false)
  })

  it('has a label for every action', () => {
    expect(Object.keys(ACTION_LABELS).sort()).toEqual(['CREATE', 'DELETE', 'IMPORT', 'REORDER', 'RESET', 'RESTORE', 'SAVE', 'UPDATE'])
  })
})

describe('timeAgo', () => {
  const now = new Date('2026-10-02T12:00:00.000Z')
  it('reads naturally', () => {
    expect(timeAgo('2026-10-02T11:59:40.000Z', now)).toBe('just now')
    expect(timeAgo('2026-10-02T11:30:00.000Z', now)).toBe('30 minutes ago')
    expect(timeAgo('2026-10-02T09:00:00.000Z', now)).toBe('3 hours ago')
    expect(timeAgo('2026-10-01T12:00:00.000Z', now)).toBe('yesterday')
    expect(timeAgo('2026-09-02T12:00:00.000Z', now)).toBe('last month')
  })
})
