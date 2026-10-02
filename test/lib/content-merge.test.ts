import { contactInfo, homeStoryCards, regionStories } from '@/data/data'
import { valueDefaults } from '@/data/content-registry'
import { getDictionary } from '@/i18n/getDictionary'
import {
  applyDictionaryOverrides,
  defaultCopy,
  defaultStories,
  resolveSocials,
  resolveStories,
  resolveValues,
} from '@/libs/contentMerge'

describe('multi-paragraph copy', () => {
  it('splits on blank lines, keeps single line breaks, and any paragraph count works (1..N)', async () => {
    const base = await getDictionary('en')
    const key = 'marketing.home.about.body'
    const apply = (text: string) =>
      applyDictionaryOverrides(base, [{ key, valueId: text, valueEn: text }], 'en').marketing.home.about.body

    expect(apply('Only one')).toEqual(['Only one'])
    expect(apply('One\n\nTwo\n\n\n  \nThree')).toEqual(['One', 'Two', 'Three'])
    expect(apply('Line a\nline b\n\nSecond')).toEqual(['Line a\nline b', 'Second'])
    expect(apply('A\r\n\r\nB')).toEqual(['A', 'B'])
  })

  it('the joined default text round-trips to the original array ("Use default" is a no-op)', async () => {
    const base = await getDictionary('id')
    const key = 'marketing.home.regions.sulawesi.about.body'
    const joined = defaultCopy(base, key)
    const back = applyDictionaryOverrides(base, [{ key, valueId: joined, valueEn: joined }], 'id')
    expect(back).toEqual(base)
  })

  it('never turns a non-array field into an array', async () => {
    const base = await getDictionary('en')
    const rows = [{ key: 'marketing.home.hero.title', valueId: 'A\n\nB', valueEn: 'A\n\nB' }]
    expect(applyDictionaryOverrides(base, rows, 'en').marketing.home.hero.title).toBe('A\n\nB')
  })
})

describe('applyDictionaryOverrides', () => {
  it('returns an identical dictionary when there are no rows', async () => {
    const base = await getDictionary('en')
    expect(applyDictionaryOverrides(base, [], 'en')).toEqual(base)
  })

  it('overrides only the requested locale and never mutates the shared dictionary', async () => {
    const base = await getDictionary('en')
    const before = base.marketing.home.hero.title
    const rows = [{ key: 'marketing.home.hero.title', valueId: 'Judul baru', valueEn: 'New title' }]

    expect(applyDictionaryOverrides(base, rows, 'en').marketing.home.hero.title).toBe('New title')
    expect(applyDictionaryOverrides(await getDictionary('id'), rows, 'id').marketing.home.hero.title).toBe('Judul baru')
    expect(base.marketing.home.hero.title).toBe(before)
  })

  it('supports array-index paths like newsDetail.about.cards.1.title', async () => {
    const base = await getDictionary('en')
    const rows = [{ key: 'marketing.newsDetail.about.cards.1.title', valueId: null, valueEn: 'Second card' }]
    const dict = applyDictionaryOverrides(base, rows, 'en')
    expect(dict.marketing.newsDetail.about.cards[1].title).toBe('Second card')
    expect(dict.marketing.newsDetail.about.cards[0].title).toBe(base.marketing.newsDetail.about.cards[0].title)
  })

  it('treats empty / whitespace values as "use default"', async () => {
    const base = await getDictionary('en')
    const rows = [{ key: 'marketing.home.hero.title', valueId: 'x', valueEn: '   ' }]
    expect(applyDictionaryOverrides(base, rows, 'en').marketing.home.hero.title).toBe(base.marketing.home.hero.title)
  })

  it('ignores keys that are not in the registry and value-field keys', async () => {
    const base = await getDictionary('en')
    const rows = [
      { key: 'marketing.nav.__proto__', valueId: 'x', valueEn: 'x' },
      { key: 'marketing.home.news.items.sulawesi.title', valueId: 'x', valueEn: 'x' },
      { key: 'media.home.about.image', valueId: 'x', valueEn: 'x' },
    ]
    expect(applyDictionaryOverrides(base, rows, 'en')).toEqual(base)
  })
})

describe('resolveValues', () => {
  it('returns the built-in defaults when there are no rows', () => {
    expect(resolveValues([], 'en')).toEqual(valueDefaults)
  })

  it('applies non-empty rows and ignores unknown keys', () => {
    const values = resolveValues(
      [
        { key: 'media.home.hero.video', valueId: 'https://cdn.example.com/a.mp4', valueEn: null },
        { key: 'media.home.about.image', valueId: '', valueEn: null },
        { key: 'media.nope', valueId: 'x', valueEn: 'x' },
      ],
      'en',
    )
    expect(values['media.home.hero.video']).toBe('https://cdn.example.com/a.mp4')
    expect(values['media.home.about.image']).toBe(valueDefaults['media.home.about.image'])
    expect(values).not.toHaveProperty('media.nope')
  })
})

describe('stories', () => {
  it('defaults match what the components used to hardcode', async () => {
    const dict = await getDictionary('en')
    const home = defaultStories('stories.home', dict)
    expect(home.map((s) => s.name)).toEqual(homeStoryCards.map((c) => c.name))
    expect(home.map((s) => s.imageUrl)).toEqual(['/stories.jpeg', '/stories1.jpeg'])
    expect(home[0].quote).toBe(dict.marketing.home.ourStories.cards[0].quote)

    const sulawesi = defaultStories('stories.sulawesi', dict)
    expect(sulawesi.map((s) => s.name)).toEqual(regionStories.sulawesi.map((c) => c.name))
    expect(sulawesi[1].quote).toBe(dict.marketing.home.regions.sulawesi.ourStories.cards[1].quote)
    expect(defaultStories('stories.unknown', dict)).toEqual([])
  })

  it('prefers stored items, ordered, localised, with positional default image', async () => {
    const dict = await getDictionary('en')
    const rows = [
      { id: 'b', collection: 'stories.home', order: 1, data: { quote: { id: 'Dua', en: '' }, name: 'B', imageUrl: '' } },
      { id: 'a', collection: 'stories.home', order: 0, data: { quote: { id: 'Satu', en: 'One' }, name: 'A', imageUrl: '/x.jpg' } },
      { id: 'z', collection: 'stories.sulawesi', order: 0, data: { quote: { id: 'x', en: 'x' }, name: 'Z', imageUrl: '' } },
    ]
    expect(resolveStories('stories.home', rows, 'en', dict)).toEqual([
      { id: 'a', name: 'A', quote: 'One', imageUrl: '/x.jpg' },
      { id: 'b', name: 'B', quote: 'Dua', imageUrl: '/stories1.jpeg' },
    ])
  })

  it('falls back to the defaults when the collection has no stored items', async () => {
    const dict = await getDictionary('id')
    expect(resolveStories('stories.home', [], 'id', dict)).toEqual(defaultStories('stories.home', dict))
  })
})

describe('socials', () => {
  it('defaults to the built-in contact list, and prefers stored items', () => {
    expect(resolveSocials([]).map((s) => s.handle)).toEqual(contactInfo.socials.map((s) => s.handle))
    expect(
      resolveSocials([{ id: 'x', collection: 'contact.socials', order: 0, data: { handle: '@a', href: 'https://x.co/a' } }]),
    ).toEqual([{ id: 'x', handle: '@a', href: 'https://x.co/a', platform: 'instagram' }])
    expect(
      resolveSocials([{ id: 'y', collection: 'contact.socials', order: 0, data: { handle: '@b', href: 'https://x.co/b', platform: 'youtube' } }])[0].platform,
    ).toBe('youtube')
    // unknown platforms fall back to Instagram instead of breaking the footer
    expect(
      resolveSocials([{ id: 'z', collection: 'contact.socials', order: 0, data: { handle: '@c', href: 'https://x.co/c', platform: 'myspace' } }])[0].platform,
    ).toBe('instagram')
    expect(resolveSocials([]).every((social) => social.platform === 'instagram')).toBe(true)
  })
})
