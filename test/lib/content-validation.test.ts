import { collectionsById } from '@/data/content-registry'
import { validateItemData, validateValue } from '@/libs/contentValidation'

describe('validateValue', () => {
  it('always allows empty (means "use default")', () => {
    for (const type of ['text', 'textarea', 'image', 'video', 'link'] as const) {
      expect(validateValue(type, '')).toBeNull()
    }
  })

  // The full catalogue of accepted/rejected image URL kinds is in image-urls.test.ts.
  it('accepts public/ paths and https images from any host, never javascript:/data:/plain http', () => {
    expect(validateValue('image', '/about.jpg')).toBeNull()
    expect(validateValue('image', 'https://media.indonesiatanpapolusi.org/site/admin_1/a.jpg')).toBeNull()
    expect(validateValue('image', 'https://images.unsplash.com/photo-123?w=1200')).toBeNull()
    expect(validateValue('image', 'http://media.indonesiatanpapolusi.org/site/a.jpg')).not.toBeNull()
    expect(validateValue('image', '//evil.example/a.jpg')).not.toBeNull()
    expect(validateValue('image', 'javascript:alert(1)')).not.toBeNull()
  })

  it('accepts https video URLs and local paths, rejects everything else', () => {
    expect(validateValue('video', 'https://cdn.example.com/clip.mp4')).toBeNull()
    expect(validateValue('video', '/heros.compressed.mp4')).toBeNull()
    expect(validateValue('video', 'http://cdn.example.com/clip.mp4')).not.toBeNull()
    expect(validateValue('video', 'data:video/mp4;base64,AAAA')).not.toBeNull()
    expect(validateValue('video', 'not a url')).not.toBeNull()
  })

  it('accepts anchors, paths, https and mailto links, rejects javascript:', () => {
    expect(validateValue('link', '#about')).toBeNull()
    expect(validateValue('link', '/en/news')).toBeNull()
    expect(validateValue('link', 'https://instagram.com/x')).toBeNull()
    expect(validateValue('link', 'mailto:a@b.co')).toBeNull()
    expect(validateValue('link', 'javascript:alert(1)')).not.toBeNull()
    expect(validateValue('link', 'http://insecure.example')).not.toBeNull()
  })

  it('enforces text length limits', () => {
    expect(validateValue('text', 'x'.repeat(301))).not.toBeNull()
    expect(validateValue('textarea', 'x'.repeat(4001))).not.toBeNull()
    expect(validateValue('textarea', 'x'.repeat(4000))).toBeNull()
  })
})

describe('validateItemData', () => {
  const stories = collectionsById.get('stories.home')!

  it('normalises a valid story and drops unknown fields', () => {
    const result = validateItemData(stories, {
      quote: { id: ' Halo ', en: 'Hello' },
      name: ' Parker G. ',
      imageUrl: '',
      extra: 'ignored',
    })
    expect(result).toEqual({
      ok: true,
      data: { quote: { id: 'Halo', en: 'Hello' }, name: 'Parker G.', imageUrl: '' },
    })
  })

  it('allows a quote in only one language', () => {
    const result = validateItemData(stories, { quote: { id: 'Halo', en: '' }, name: 'A', imageUrl: '' })
    expect(result.ok).toBe(true)
  })

  it('rejects a missing name, an empty quote and bad images', () => {
    expect(validateItemData(stories, { quote: { id: 'a', en: 'a' }, name: '', imageUrl: '' }).ok).toBe(false)
    expect(validateItemData(stories, { quote: { id: '', en: '' }, name: 'A', imageUrl: '' }).ok).toBe(false)
    expect(
      validateItemData(stories, { quote: { id: 'a', en: 'a' }, name: 'A', imageUrl: 'javascript:alert(1)' }).ok,
    ).toBe(false)
    expect(validateItemData(stories, 'nope').ok).toBe(false)
  })
})

describe('validateItemData — select fields', () => {
  const socials = collectionsById.get('contact.socials')!
  const base = { handle: '@a', href: 'https://instagram.com/a' }

  it('accepts a listed platform, or none (defaults to Instagram)', () => {
    expect(validateItemData(socials, { ...base, platform: 'tiktok' })).toEqual({ ok: true, data: { ...base, platform: 'tiktok' } })
    expect(validateItemData(socials, { ...base, platform: '' }).ok).toBe(true)
  })

  it('rejects an unlisted platform', () => {
    expect(validateItemData(socials, { ...base, platform: 'myspace' }).ok).toBe(false)
  })
})
