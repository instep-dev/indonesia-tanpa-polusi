import type {
  CollectionSnapshot,
  FieldSnapshot,
  ItemSnapshot,
  RegionSnapshot,
} from '@/services/content-revision/content-revision.dto'
import type { ItemData } from '@/services/content-item/content-item.dto'

// Revision snapshots are stored as JSON, so they are checked before use (a
// hand-edited row or an older shape must never crash the editor or a restore).

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string'

export const isFieldSnapshot = (value: unknown): value is FieldSnapshot =>
  isRecord(value) && isNullableString(value.valueId) && isNullableString(value.valueEn)

export const isRegionSnapshot = (value: unknown): value is RegionSnapshot =>
  isRecord(value) && typeof value.nameId === 'string' && typeof value.nameEn === 'string'

export const isCollectionSnapshot = (value: unknown): value is CollectionSnapshot =>
  isRecord(value) && Array.isArray(value.ids) && value.ids.every((id) => typeof id === 'string')

const isItemData = (value: unknown): value is ItemData =>
  isRecord(value) &&
  Object.values(value).every(
    (entry) =>
      typeof entry === 'string' ||
      (isRecord(entry) && typeof entry.id === 'string' && typeof entry.en === 'string'),
  )

export const isItemSnapshot = (value: unknown): value is ItemSnapshot =>
  isRecord(value) && isItemData(value.data) && typeof value.order === 'number' && typeof value.deleted === 'boolean'
