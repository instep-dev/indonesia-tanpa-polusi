export type ItemData = Record<string, string | { id: string; en: string }>

export type ContentItemDto = {
  id: string
  collection: string
  order: number
  data: ItemData
}

export type ContentItemsResponse = {
  items: ContentItemDto[]
  /** Built-in items, shown (and copyable into the editor) while nothing is stored. */
  defaults: ItemData[]
  usingDefaults: boolean
  /** Recently removed items (newest first), which can be restored. */
  removed: ContentItemDto[]
}

export type CreateContentItemBody =
  | { collection: string; data: ItemData }
  | { collection: string; items: ItemData[] }

export type UpdateContentItemBody = {
  data: ItemData
}

export type ReorderContentItemsBody = {
  collection: string
  ids: string[]
}
