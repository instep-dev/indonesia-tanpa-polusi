import {
  draftToValue,
  initialValue,
  planPublish,
  planSaveDraft,
  previewPathFor,
  toPayload,
  unpublishedKeys,
  unsavedKeys,
} from '@/libs/contentDraftState'

const title = { key: 'hero.title', localized: true }
const video = { key: 'media.video', localized: false }
const defaults = { valueId: 'Default ID', valueEn: 'Default EN' }
const published = { valueId: 'Tayang', valueEn: 'Live' }
const edited = { valueId: 'Draf', valueEn: 'Draft' }

const state = (over: Record<string, unknown> = {}) => ({
  field: title,
  local: published,
  initial: published,
  published,
  defaults,
  hasDraft: false,
  ...over,
})

describe('initialValue / draftToValue', () => {
  it('starts from the draft when there is one, otherwise from the published value', () => {
    expect(initialValue(published, { valueId: 'Draf', valueEn: 'Draft' }, defaults)).toEqual(edited)
    expect(initialValue(published, null, defaults)).toEqual(published)
  })

  it('a draft of "no override" means the built-in default', () => {
    expect(draftToValue({ valueId: null, valueEn: null }, defaults)).toEqual(defaults)
    expect(draftToValue({ valueId: 'Draf', valueEn: null }, defaults)).toEqual({ valueId: 'Draf', valueEn: 'Default EN' })
  })
})

describe('toPayload', () => {
  it('sends a value equal to the built-in default as empty (reset)', () => {
    expect(toPayload(title, defaults, defaults)).toEqual({ key: 'hero.title', valueId: '', valueEn: '' })
    expect(toPayload(title, edited, defaults)).toEqual({ key: 'hero.title', valueId: 'Draf', valueEn: 'Draft' })
  })

  it('never sends an English value for a non-localized field', () => {
    expect(toPayload(video, { valueId: 'https://a/b.mp4', valueEn: 'ignored' }, { valueId: '', valueEn: '' })).toEqual({
      key: 'media.video',
      valueId: 'https://a/b.mp4',
      valueEn: '',
    })
  })
})

describe('planSaveDraft', () => {
  it('saves fields that differ from the published version', () => {
    const plan = planSaveDraft([state({ local: edited }), state({ field: video, local: published })])
    expect(plan.toSave.map((p) => p.key)).toEqual(['hero.title'])
    expect(plan.toDiscard).toEqual([])
  })

  it('discards the draft of a field typed back to the published value', () => {
    const plan = planSaveDraft([state({ local: published, hasDraft: true })])
    expect(plan).toEqual({ toSave: [], toDiscard: ['hero.title'] })
  })

  it('does nothing for an untouched page', () => {
    expect(planSaveDraft([state()])).toEqual({ toSave: [], toDiscard: [] })
  })
})

describe('planPublish', () => {
  it('publishes what differs and supersedes every existing draft', () => {
    const plan = planPublish([
      state({ local: edited, hasDraft: true }),
      state({ field: video, local: published, hasDraft: true }), // draft reverted → just cleared
      state({ field: { key: 'other', localized: true } }),
    ])
    expect(plan.toPublish.map((p) => p.key)).toEqual(['hero.title'])
    expect(plan.clearDrafts).toEqual(['hero.title', 'media.video'])
  })
})

describe('unsavedKeys / unpublishedKeys', () => {
  it('tell typing apart from drafts', () => {
    // typed over the draft the form started with
    const typed = state({ local: { ...edited, valueEn: 'More' }, initial: edited, hasDraft: true })
    // loaded from a saved draft, untouched
    const drafted = state({ field: video, local: edited, initial: edited, hasDraft: true })

    expect(unsavedKeys([typed, drafted])).toEqual(['hero.title'])
    expect(unpublishedKeys([typed, drafted])).toEqual(['hero.title', 'media.video'])
    expect(unpublishedKeys([state()])).toEqual([])
  })
})

describe('previewPathFor', () => {
  it('previews the matching public page, and the home page for site-wide settings', () => {
    expect(previewPathFor('home', 'en')).toBe('/en')
    expect(previewPathFor('site', 'id')).toBe('/id')
    expect(previewPathFor('seo', 'en')).toBe('/en')
    expect(previewPathFor('sulawesi', 'id')).toBe('/id/sulawesi')
    expect(previewPathFor('news', 'en')).toBe('/en/news')
  })
})
