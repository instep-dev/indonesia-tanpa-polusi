import { generateHTML, generateJSON } from '@tiptap/html/server'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { collectTextBlocks } from '@/libs/tiptapText'
import type { TiptapNode } from '@/libs/tiptapText'

// LibreTranslate client. Translation is an explicit editor action ("Translate"
// button → POST /api/translate); nothing translates behind an author's back.

export type TranslateLocale = 'id' | 'en'

const TIMEOUT_MS = 25_000
// Same extensions the editor / ArticleContentPreview use, so marks and links round-trip.
const EXTENSIONS = [StarterKit, Image]

export const isTranslationConfigured = (): boolean => !!process.env.TRANSLATE_API_URL

const targetLocale = (source: TranslateLocale): TranslateLocale => (source === 'id' ? 'en' : 'id')

type ApiResult = { ok: true; translated: string[] } | { ok: false; reason: 'not-configured' | 'failed' }

// One request, many strings: LibreTranslate accepts `q` as an array and answers
// with an array in the same order.
const callApi = async (texts: string[], source: TranslateLocale, format: 'text' | 'html'): Promise<ApiResult> => {
  const endpoint = process.env.TRANSLATE_API_URL
  if (!endpoint) return { ok: false, reason: 'not-configured' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TRANSLATE_API_KEY ? { Authorization: `Bearer ${process.env.TRANSLATE_API_KEY}` } : {}),
      },
      body: JSON.stringify({ q: texts, source, target: targetLocale(source), format }),
    })
    if (!res.ok) return { ok: false, reason: 'failed' }

    const data = (await res.json()) as { translatedText?: string | string[] }
    const list = Array.isArray(data.translatedText)
      ? data.translatedText
      : typeof data.translatedText === 'string'
        ? [data.translatedText]
        : null
    if (!list || list.length !== texts.length) return { ok: false, reason: 'failed' }

    return { ok: true, translated: list }
  } catch {
    return { ok: false, reason: 'failed' }
  } finally {
    clearTimeout(timer)
  }
}

export type PlainTranslation = { ok: true; text: string } | { ok: false; reason: 'not-configured' | 'failed' }
export type PlainBatchTranslation = { ok: true; texts: string[] } | { ok: false; reason: 'not-configured' | 'failed' }

/** Translates several plain-text fields in ONE request. Blank entries stay blank, in place, and are not sent. */
export const translatePlainTexts = async (texts: string[], source: TranslateLocale): Promise<PlainBatchTranslation> => {
  const indexes = texts.flatMap((text, index) => (text.trim() ? [index] : []))
  if (indexes.length === 0) return { ok: true, texts: texts.map(() => '') }

  const result = await callApi(indexes.map((index) => texts[index]), source, 'text')
  if (!result.ok) return result

  const translated = texts.map(() => '')
  indexes.forEach((index, position) => {
    translated[index] = result.translated[position]
  })
  return { ok: true, texts: translated }
}

/** Translates one plain-text field (title, excerpt, CMS copy). */
export const translatePlainText = async (text: string, source: TranslateLocale): Promise<PlainTranslation> => {
  const result = await translatePlainTexts([text], source)
  return result.ok ? { ok: true, text: result.texts[0] } : result
}

export type DocumentTranslation =
  | { ok: true; content: unknown; totalBlocks: number; failedBlocks: number }
  | { ok: false; reason: 'not-configured' | 'failed' }

const cloneDocument = (content: unknown): TiptapNode => JSON.parse(JSON.stringify(content)) as TiptapNode

const blockToHtml = (block: TiptapNode): string => generateHTML({ type: 'doc', content: [block] }, EXTENSIONS)

/** Parses translated HTML back to inline nodes, or null when it no longer looks like the same kind of block. */
const htmlToInline = (html: string, block: TiptapNode): TiptapNode[] | null => {
  try {
    const parsed = generateJSON(html, EXTENSIONS) as TiptapNode
    const first = parsed.content?.[0]
    if (!first || first.type !== block.type || !first.content?.length) return null
    return first.content
  } catch {
    return null
  }
}

/**
 * Translates a Tiptap document block by block.
 *
 * Each paragraph/heading is sent as HTML (marks and links stay attached to the
 * right words, so word order inside a sentence is translated as a whole), all in
 * ONE batched request. A block that comes back unusable keeps its source text
 * and is counted in `failedBlocks`; the rest of the document is kept. If the HTML
 * request itself fails, it falls back to translating raw text runs.
 */
export const translateDocument = async (content: unknown, source: TranslateLocale): Promise<DocumentTranslation> => {
  if (!isTranslationConfigured()) return { ok: false, reason: 'not-configured' }
  if (!content || typeof content !== 'object') return { ok: true, content, totalBlocks: 0, failedBlocks: 0 }

  const doc = cloneDocument(content)
  const blocks = collectTextBlocks(doc)
  if (blocks.length === 0) return { ok: true, content: doc, totalBlocks: 0, failedBlocks: 0 }

  const html = await callApi(blocks.map(blockToHtml), source, 'html')
  if (html.ok) {
    let failedBlocks = 0
    blocks.forEach((block, index) => {
      const inline = htmlToInline(html.translated[index], block)
      if (inline) block.content = inline
      else failedBlocks += 1
    })
    return { ok: true, content: doc, totalBlocks: blocks.length, failedBlocks }
  }

  // Fallback: translate each text run on its own (loses cross-mark word order, but still works).
  const runs = blocks.flatMap((block) => (block.content ?? []).filter((node) => node.type === 'text' && node.text?.trim()))
  const plain = await callApi(runs.map((node) => node.text as string), source, 'text')
  if (!plain.ok) return plain

  runs.forEach((node, index) => {
    node.text = plain.translated[index]
  })
  return { ok: true, content: doc, totalBlocks: blocks.length, failedBlocks: 0 }
}
