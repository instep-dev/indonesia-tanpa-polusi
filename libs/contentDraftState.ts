// Draft / publish bookkeeping for the CMS page editor, as pure functions.
//
// Three versions of every field exist:
//   published — what visitors see (stored override, or the built-in default)
//   draft     — an unpublished copy saved on the server (preview only)
//   local     — what is currently typed in the form
// The form starts from the draft when there is one, otherwise from the published value.

export type FieldValue = { valueId: string; valueEn: string }

export type EditableField = { key: string; localized: boolean }

export type FieldPayload = { key: string; valueId: string; valueEn: string }

export type ServerDraft = { valueId: string | null; valueEn: string | null }

const sameValue = (field: EditableField, a: FieldValue, b: FieldValue): boolean =>
  a.valueId === b.valueId && (!field.localized || a.valueEn === b.valueEn)

/** A draft of "no override" (both null) means the built-in default. */
export const draftToValue = (draft: ServerDraft, defaults: FieldValue): FieldValue => ({
  valueId: draft.valueId ?? defaults.valueId,
  valueEn: draft.valueEn ?? defaults.valueEn,
})

/** What the form starts with for a field. */
export const initialValue = (published: FieldValue, draft: ServerDraft | null, defaults: FieldValue): FieldValue =>
  draft ? draftToValue(draft, defaults) : published

/** A value equal to the built-in default is sent as empty, i.e. "reset to default". */
export const toPayload = (field: EditableField, value: FieldValue, defaults: FieldValue): FieldPayload => ({
  key: field.key,
  valueId: value.valueId.trim() === defaults.valueId ? '' : value.valueId,
  valueEn: !field.localized || value.valueEn.trim() === defaults.valueEn ? '' : value.valueEn,
})

export type DraftPlan = {
  /** Fields that differ from the published version → saved as drafts. */
  toSave: FieldPayload[]
  /** Fields whose local value is back to the published one but still have a server draft → drafts to discard. */
  toDiscard: string[]
}

type FieldState = {
  field: EditableField
  local: FieldValue
  published: FieldValue
  defaults: FieldValue
  hasDraft: boolean
}

export const planSaveDraft = (states: FieldState[]): DraftPlan => ({
  toSave: states
    .filter(({ field, local, published }) => !sameValue(field, local, published))
    .map(({ field, local, defaults }) => toPayload(field, local, defaults)),
  toDiscard: states
    .filter(({ field, local, published, hasDraft }) => hasDraft && sameValue(field, local, published))
    .map(({ field }) => field.key),
})

export type PublishPlan = {
  /** Fields to write live (those that differ from what is published now). */
  toPublish: FieldPayload[]
  /** Every field that has a server draft — publishing supersedes them all. */
  clearDrafts: string[]
}

export const planPublish = (states: FieldState[]): PublishPlan => ({
  toPublish: states
    .filter(({ field, local, published }) => !sameValue(field, local, published))
    .map(({ field, local, defaults }) => toPayload(field, local, defaults)),
  clearDrafts: states.filter(({ hasDraft }) => hasDraft).map(({ field }) => field.key),
})

/** Keys of fields whose form value differs from what the form started with (unsaved typing). */
export const unsavedKeys = (states: Array<{ field: EditableField; local: FieldValue; initial: FieldValue }>): string[] =>
  states.filter(({ field, local, initial }) => !sameValue(field, local, initial)).map(({ field }) => field.key)

/** Keys of fields that differ from the published version (drafted or typed) — what "Publish" would change. */
export const unpublishedKeys = (states: FieldState[]): string[] =>
  states.filter(({ field, local, published }) => !sameValue(field, local, published)).map(({ field }) => field.key)

/** The public page to preview for a CMS page (site-wide pages preview the home page). */
export const previewPathFor = (pageSlug: string, locale: 'en' | 'id'): string =>
  ['home', 'site', 'seo'].includes(pageSlug) ? `/${locale}` : `/${locale}/${pageSlug}`
