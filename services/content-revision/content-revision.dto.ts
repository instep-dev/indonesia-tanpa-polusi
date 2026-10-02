import type { ItemData } from '@/services/content-item/content-item.dto'

export type RevisionKind = 'field' | 'item' | 'collection' | 'region'
export type RevisionAction =
  | 'SAVE'
  | 'RESET'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'REORDER'
  | 'RESTORE'
  | 'IMPORT'

// State AFTER the change, per kind.
export type FieldSnapshot = { valueId: string | null; valueEn: string | null }
export type ItemSnapshot = { data: ItemData; order: number; deleted: boolean }
export type CollectionSnapshot = { ids: string[] }
export type RegionSnapshot = { nameId: string; nameEn: string }

export type ContentRevisionDto = {
  id: string
  kind: RevisionKind
  targetKey: string
  collection: string | null
  status: 'PUBLISHED' | 'DRAFT'
  action: RevisionAction
  snapshot: unknown
  createdByName: string
  createdAt: string
}
