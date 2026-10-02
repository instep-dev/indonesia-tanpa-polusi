export type ContentFieldDto = {
  key: string
  /** Stored override, or null when the field uses its built-in default. */
  valueId: string | null
  valueEn: string | null
  defaultId: string
  defaultEn: string
  /** Who last changed this field, and when (null if it was never edited in the CMS). */
  lastEdit: { by: string; at: string } | null
  /** An unpublished draft of this field (shown only in preview until published), or null. A draft of "no override" has both values null. */
  draft: { valueId: string | null; valueEn: string | null } | null
}

export type SiteContentResponse = {
  fields: ContentFieldDto[]
}

export type SaveContentFieldInput = {
  key: string
  valueId: string | null
  valueEn: string | null
}

export type SaveSiteContentBody = {
  fields: SaveContentFieldInput[]
  /** Fields whose draft is superseded by this publish. */
  clearDrafts?: string[]
}

export type SaveDraftsBody = {
  fields: SaveContentFieldInput[]
}

export type DiscardDraftsBody = {
  keys: string[]
}
