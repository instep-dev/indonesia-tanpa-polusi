import { diffWords } from 'diff'
import { isCollectionSnapshot, isFieldSnapshot, isItemSnapshot, isRegionSnapshot } from '@/libs/revisionSnapshots'
import type { ItemData } from '@/services/content-item/content-item.dto'
import type { ContentRevisionDto, RevisionAction } from '@/services/content-revision/content-revision.dto'

// Turns revision snapshots into plain text so the History dialog can show what
// changed (a word-level diff against the previous version).

const itemText = (data: ItemData): string =>
  Object.entries(data)
    .map(([name, value]) =>
      typeof value === 'string' ? `${name}: ${value}` : `${name} (ID): ${value.id}\n${name} (EN): ${value.en}`,
    )
    .join('\n')

/** One-string description of the state a revision left behind. */
export const snapshotText = (revision: Pick<ContentRevisionDto, 'kind' | 'snapshot'>): string => {
  const { kind, snapshot } = revision
  if (kind === 'field' && isFieldSnapshot(snapshot)) {
    if (snapshot.valueId === null && snapshot.valueEn === null) return '(built-in default)'
    return [`ID: ${snapshot.valueId ?? '—'}`, `EN: ${snapshot.valueEn ?? '—'}`].join('\n')
  }
  if (kind === 'item' && isItemSnapshot(snapshot)) {
    return snapshot.deleted ? `(removed)\n${itemText(snapshot.data)}` : itemText(snapshot.data)
  }
  if (kind === 'region' && isRegionSnapshot(snapshot)) return `ID: ${snapshot.nameId}\nEN: ${snapshot.nameEn}`
  if (kind === 'collection' && isCollectionSnapshot(snapshot)) return `New order: ${snapshot.ids.length} items`
  return ''
}

export type DiffPart = { text: string; added: boolean; removed: boolean }

/** Word-level diff between the previous version's text and this one's (previous is empty for the first revision). */
export const diffText = (previous: string, current: string): DiffPart[] =>
  diffWords(previous, current).map((part) => ({ text: part.value, added: !!part.added, removed: !!part.removed }))

export const ACTION_LABELS: Record<RevisionAction, string> = {
  SAVE: 'Edited',
  RESET: 'Reset to default',
  CREATE: 'Added',
  UPDATE: 'Edited',
  DELETE: 'Removed',
  REORDER: 'Reordered',
  RESTORE: 'Restored an earlier version',
  IMPORT: 'Imported',
}

/** Only these can be put back with "Restore this version". */
export const isRestorable = (revision: Pick<ContentRevisionDto, 'kind' | 'status'>): boolean =>
  revision.status === 'PUBLISHED' && (revision.kind === 'field' || revision.kind === 'item' || revision.kind === 'region')
