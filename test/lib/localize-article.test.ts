import { hasLocale, pickLocale } from '@/libs/localizeArticle'

const doc = (text: string) => ({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })

const both = {
  titleId: 'Judul',
  titleEn: 'Title',
  excerptId: 'Ringkasan',
  excerptEn: 'Summary',
  contentId: doc('Isi'),
  contentEn: doc('Body'),
}
const indonesianOnly = { ...both, titleEn: '', excerptEn: '', contentEn: {} }

describe('pickLocale', () => {
  it('returns each language as written when both exist', () => {
    const en = pickLocale(both, 'en')
    expect(en).toMatchObject({ title: 'Title', excerpt: 'Summary', titleLocale: 'en', contentLocale: 'en', isFallback: false })
    expect(pickLocale(both, 'id')).toMatchObject({ title: 'Judul', isFallback: false })
  })

  it('falls back to the other language for everything an English reader would otherwise see blank', () => {
    const en = pickLocale(indonesianOnly, 'en')
    expect(en).toMatchObject({
      title: 'Judul',
      excerpt: 'Ringkasan',
      titleLocale: 'id',
      excerptLocale: 'id',
      contentLocale: 'id',
      isFallback: true,
    })
    expect(en.content).toEqual(indonesianOnly.contentId)
    // ...while the Indonesian page is untouched
    expect(pickLocale(indonesianOnly, 'id').isFallback).toBe(false)
  })

  it('falls back part by part: an English title stays English when only the excerpt is missing', () => {
    const result = pickLocale({ ...both, excerptEn: '  ' }, 'en')
    expect(result).toMatchObject({ title: 'Title', titleLocale: 'en', excerpt: 'Ringkasan', excerptLocale: 'id', contentLocale: 'en', isFallback: true })
  })

  it('treats an editor document with no text as empty, but an image-only one as content', () => {
    const emptyParagraph = { type: 'doc', content: [{ type: 'paragraph' }] }
    expect(pickLocale({ ...both, contentEn: emptyParagraph }, 'en').contentLocale).toBe('id')

    const imageOnly = { type: 'doc', content: [{ type: 'image', attrs: { src: '/x.jpg' } }] }
    expect(pickLocale({ ...both, contentEn: imageOnly }, 'en').contentLocale).toBe('en')
  })

  it('shows blanks (not a crash) when neither language has anything', () => {
    const empty = { titleId: '', titleEn: '', excerptId: '', excerptEn: '', contentId: {}, contentEn: {} }
    expect(pickLocale(empty, 'en')).toMatchObject({ title: '', excerpt: '', isFallback: false })
  })
})

describe('hasLocale', () => {
  it('needs a title and some content', () => {
    expect(hasLocale(both, 'en')).toBe(true)
    expect(hasLocale(indonesianOnly, 'en')).toBe(false)
    expect(hasLocale(indonesianOnly, 'id')).toBe(true)
    expect(hasLocale({ ...both, contentEn: {} }, 'en')).toBe(false)
  })
})

describe('displayTitle (admin lists)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { displayTitle } = require('@/libs/articleLocale') as typeof import('@/libs/articleLocale')

  it('shows the source-language title, or the other one when it is empty', () => {
    expect(displayTitle({ sourceLocale: 'id', titleId: 'Judul', titleEn: 'Title' })).toBe('Judul')
    expect(displayTitle({ sourceLocale: 'en', titleId: 'Judul', titleEn: 'Title' })).toBe('Title')
    expect(displayTitle({ sourceLocale: 'id', titleId: '', titleEn: 'Title' })).toBe('Title')
    expect(displayTitle({ sourceLocale: 'en', titleId: 'Judul', titleEn: '  ' })).toBe('Judul')
    expect(displayTitle({ sourceLocale: 'id', titleId: '', titleEn: '' })).toBe('')
  })
})
