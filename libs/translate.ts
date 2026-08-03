type TranslateResult = { ok: true; text: string } | { ok: false }

const targetLocale = (source: 'id' | 'en'): 'id' | 'en' => (source === 'id' ? 'en' : 'id')

const translateText = async (text: string, source: 'id' | 'en'): Promise<TranslateResult> => {
  const endpoint = process.env.TRANSLATE_API_URL
  if (!endpoint || !text) return { ok: false }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.TRANSLATE_API_KEY
          ? { Authorization: `Bearer ${process.env.TRANSLATE_API_KEY}` }
          : {}),
      },
      body: JSON.stringify({ q: text, source, target: targetLocale(source) }),
    })

    if (!res.ok) return { ok: false }

    const data = (await res.json()) as { translatedText?: string }
    if (!data.translatedText) return { ok: false }

    return { ok: true, text: data.translatedText }
  } catch {
    return { ok: false }
  }
}

// A Tiptap/ProseMirror document is a tree of nodes; only leaf `text` nodes
// carry translatable copy. Everything else (type, attrs, marks — bold,
// italic, links, headings, lists...) must survive untouched.
type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
  [key: string]: unknown
}

const collectTextNodes = (node: TiptapNode, out: TiptapNode[]): void => {
  if (node.type === 'text' && typeof node.text === 'string' && node.text.trim().length > 0) {
    out.push(node)
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) collectTextNodes(child, out)
  }
}

const translateContent = async (
  content: unknown,
  source: 'id' | 'en',
): Promise<{ ok: boolean; content: unknown }> => {
  if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
    return { ok: true, content }
  }

  // Plain-JSON deep clone — Tiptap content is always JSON-serializable
  // (it's stored straight into a Postgres Json column).
  const cloned = JSON.parse(JSON.stringify(content)) as TiptapNode

  const textNodes: TiptapNode[] = []
  collectTextNodes(cloned, textNodes)
  if (textNodes.length === 0) return { ok: true, content: cloned }

  const results = await Promise.all(textNodes.map((node) => translateText(node.text as string, source)))

  let allOk = true
  results.forEach((result, i) => {
    if (result.ok) {
      textNodes[i].text = result.text
    } else {
      allOk = false
    }
  })

  return { ok: allOk, content: cloned }
}

export type TranslateArticleInput = {
  sourceLocale: 'id' | 'en'
  title: string
  excerpt: string
  content: unknown
}

export type TranslateArticleResult = {
  status: 'DONE' | 'FAILED'
  titleId: string
  titleEn: string
  excerptId: string
  excerptEn: string
  contentId: unknown
  contentEn: unknown
}

export const translateArticle = async (input: TranslateArticleInput): Promise<TranslateArticleResult> => {
  const [titleResult, excerptResult, contentResult] = await Promise.all([
    translateText(input.title, input.sourceLocale),
    translateText(input.excerpt, input.sourceLocale),
    translateContent(input.content, input.sourceLocale),
  ])

  const isId = input.sourceLocale === 'id'
  const ok = titleResult.ok && excerptResult.ok && contentResult.ok

  return {
    status: ok ? 'DONE' : 'FAILED',
    titleId: isId ? input.title : ok ? (titleResult as { text: string }).text : '',
    titleEn: isId ? (ok ? (titleResult as { text: string }).text : '') : input.title,
    excerptId: isId ? input.excerpt : ok ? (excerptResult as { text: string }).text : '',
    excerptEn: isId ? (ok ? (excerptResult as { text: string }).text : '') : input.excerpt,
    contentId: isId ? input.content : ok ? contentResult.content : {},
    contentEn: isId ? (ok ? contentResult.content : {}) : input.content,
  }
}
