import type { ContentItemDto, ItemData } from '@/services/content-item/content-item.dto'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isItemData = (value: unknown): value is ItemData =>
  isRecord(value) &&
  Object.values(value).every(
    (entry) =>
      typeof entry === 'string' ||
      (isRecord(entry) && typeof entry.id === 'string' && typeof entry.en === 'string'),
  )

type ContentItemRow = { id: string; collection: string; order: number; data: unknown }

/** Row → DTO. Rows are validated on write; anything malformed (manual DB edit) maps to empty data instead of crashing the editor. */
export const mapContentItem = (row: ContentItemRow): ContentItemDto => ({
  id: row.id,
  collection: row.collection,
  order: row.order,
  data: isItemData(row.data) ? row.data : {},
})
