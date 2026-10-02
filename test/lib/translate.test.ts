import { translateDocument, translatePlainText, translatePlainTexts } from '@/libs/translate'

const REPLACEMENTS: Record<string, string> = {
  Judul: 'Title',
  Ini: 'This',
  sangat: 'very',
  penting: 'important',
  'di sini': 'here',
  'Butir satu': 'Item one',
}
const fakeTranslate = (text: string) =>
  Object.entries(REPLACEMENTS).reduce((out, [from, to]) => out.replace(from, to), text)

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status })

type ApiBody = { q: string[]; source: string; target: string; format: string }

const originalUrl = process.env.TRANSLATE_API_URL
const useFetch = (handler: (body: ApiBody) => Response | Promise<Response>) =>
  jest.spyOn(global, 'fetch').mockImplementation(async (_url, init) => handler(JSON.parse(String(init?.body)) as ApiBody))

beforeEach(() => {
  process.env.TRANSLATE_API_URL = 'http://mock.local/translate'
})
afterEach(() => {
  process.env.TRANSLATE_API_URL = originalUrl ?? ''
  jest.restoreAllMocks()
})

const text = (value: string, marks?: unknown[]) => ({ type: 'text', text: value, ...(marks ? { marks } : {}) })

const makeDoc = () => ({
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [text('Judul')] },
    {
      type: 'paragraph',
      content: [
        text('Ini '),
        text('sangat', [{ type: 'bold' }]),
        text(' penting '),
        text('di sini', [{ type: 'link', attrs: { href: 'https://example.com', target: '_blank' } }]),
      ],
    },
    { type: 'codeBlock', content: [text('const judul = 1')] },
    { type: 'image', attrs: { src: '/x.jpg', alt: null, title: null } },
    {
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [text('Butir satu')] }] }],
    },
  ],
})

const echoHtml = (body: ApiBody) => json({ translatedText: body.q.map(fakeTranslate) })

describe('translatePlainText', () => {
  it('sends one array request in text format and returns the translation', async () => {
    const fetchMock = useFetch((body) => json({ translatedText: body.q.map(() => 'Hello') }))
    const result = await translatePlainText('Halo', 'id')

    expect(result).toEqual({ ok: true, text: 'Hello' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body).toEqual({ q: ['Halo'], source: 'id', target: 'en', format: 'text' })
  })

  it('translates en → id', async () => {
    const fetchMock = useFetch((body) => json({ translatedText: body.q }))
    await translatePlainText('Hello', 'en')
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ source: 'en', target: 'id' })
  })

  it('does not call the service for empty text', async () => {
    const fetchMock = useFetch(echoHtml)
    expect(await translatePlainText('   ', 'id')).toEqual({ ok: true, text: '' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports not-configured without calling the service', async () => {
    process.env.TRANSLATE_API_URL = ''
    const fetchMock = useFetch(echoHtml)
    expect(await translatePlainText('Halo', 'id')).toEqual({ ok: false, reason: 'not-configured' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fails cleanly on HTTP errors, malformed answers and network errors', async () => {
    useFetch(() => json({ error: 'boom' }, 500))
    expect(await translatePlainText('Halo', 'id')).toEqual({ ok: false, reason: 'failed' })

    jest.restoreAllMocks()
    useFetch(() => json({ translatedText: ['one', 'two'] })) // wrong number of results
    expect(await translatePlainText('Halo', 'id')).toEqual({ ok: false, reason: 'failed' })

    jest.restoreAllMocks()
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('network down'))
    expect(await translatePlainText('Halo', 'id')).toEqual({ ok: false, reason: 'failed' })
  })
})

describe('translatePlainTexts', () => {
  it('sends the non-blank entries in one request and puts results back in their original positions', async () => {
    const fetchMock = useFetch((body) => json({ translatedText: body.q.map((t) => `EN:${t}`) }))
    const result = await translatePlainTexts(['Satu', '  ', 'Tiga', ''], 'id')

    expect(result).toEqual({ ok: true, texts: ['EN:Satu', '', 'EN:Tiga', ''] })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).q).toEqual(['Satu', 'Tiga'])
  })

  it('does not call the service when everything is blank', async () => {
    const fetchMock = useFetch(echoHtml)
    expect(await translatePlainTexts(['', ' '], 'en')).toEqual({ ok: true, texts: ['', ''] })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('translateDocument', () => {
  it('translates block by block in ONE batched HTML request, keeping marks, links, headings, code and images', async () => {
    const fetchMock = useFetch(echoHtml)
    const original = makeDoc()
    const snapshot = JSON.stringify(original)

    const result = await translateDocument(original, 'id')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as ApiBody
    expect(body.format).toBe('html')
    expect(body.q).toHaveLength(3) // heading + paragraph + list paragraph (code and image are skipped)
    expect(body.q[1]).toContain('<strong>sangat</strong>')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.failedBlocks).toBe(0)
    expect(result.totalBlocks).toBe(3)

    const doc = result.content as ReturnType<typeof makeDoc>
    expect(doc.content[0]).toMatchObject({ type: 'heading', attrs: { level: 2 }, content: [{ text: 'Title' }] })
    const paragraph = doc.content[1].content as Array<{ text: string; marks?: Array<{ type: string; attrs?: { href: string } }> }>
    expect(paragraph.map((node) => node.text).join('')).toBe('This very important here')
    expect(paragraph.find((node) => node.text === 'very')?.marks?.[0].type).toBe('bold')
    expect(paragraph.find((node) => node.text === 'here')?.marks?.[0]).toMatchObject({ type: 'link', attrs: { href: 'https://example.com' } })
    expect(doc.content[2]).toEqual(original.content[2]) // code block untouched
    expect(doc.content[3]).toEqual(original.content[3]) // image untouched
    expect(JSON.stringify(doc.content[4])).toContain('Item one')

    expect(JSON.stringify(original)).toBe(snapshot) // the caller's document is never mutated
  })

  it('keeps the source text of a block that comes back unusable and counts it', async () => {
    useFetch((body) =>
      json({ translatedText: body.q.map((html) => (html.startsWith('<h2>') ? '<p>wrong kind of block</p>' : fakeTranslate(html))) }),
    )
    const result = await translateDocument(makeDoc(), 'id')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.failedBlocks).toBe(1)
    const doc = result.content as ReturnType<typeof makeDoc>
    expect(doc.content[0].content[0].text).toBe('Judul') // kept
    expect(JSON.stringify(doc.content[1])).toContain('very') // the rest was still translated
  })

  it('falls back to translating text runs when the HTML request fails', async () => {
    const fetchMock = useFetch((body) => (body.format === 'html' ? json({}, 500) : json({ translatedText: body.q.map(fakeTranslate) })))
    const result = await translateDocument(makeDoc(), 'id')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const second = JSON.parse(String(fetchMock.mock.calls[1][1]?.body)) as ApiBody
    expect(second.format).toBe('text')
    expect(second.q).toEqual(expect.arrayContaining(['Judul', 'sangat']))
    expect(result.ok).toBe(true)
    if (result.ok) expect(JSON.stringify(result.content)).toContain('Title')
  })

  it('fails when both attempts fail, and when not configured', async () => {
    useFetch(() => json({}, 500))
    expect(await translateDocument(makeDoc(), 'id')).toEqual({ ok: false, reason: 'failed' })

    process.env.TRANSLATE_API_URL = ''
    expect(await translateDocument(makeDoc(), 'id')).toEqual({ ok: false, reason: 'not-configured' })
  })

  it('returns empty or text-less documents untouched without calling the service', async () => {
    const fetchMock = useFetch(echoHtml)
    expect(await translateDocument({}, 'id')).toMatchObject({ ok: true, totalBlocks: 0 })
    const imageOnly = { type: 'doc', content: [{ type: 'image', attrs: { src: '/x.jpg' } }] }
    expect(await translateDocument(imageOnly, 'id')).toMatchObject({ ok: true, totalBlocks: 0, content: imageOnly })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
