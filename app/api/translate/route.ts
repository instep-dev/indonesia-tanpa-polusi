import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'
import { validateAccessToken, validateSuperAdminAccessToken } from '@/libs/validateToken'
import { requireApprovedUser } from '@/libs/requireApprovedUser'
import { parseJsonBody } from '@/libs/parseJsonBody'
import { allowRequest } from '@/libs/rateLimit'
import { measureContent } from '@/libs/tiptapText'
import { isTranslationConfigured, translateDocument, translatePlainText, translatePlainTexts } from '@/libs/translate'
import type {
  TranslateContentResponse,
  TranslateTextResponse,
  TranslateTextsResponse,
} from '@/services/translate/translate.dto'

const MAX_TEXT_CHARS = 4_000
const MAX_TEXTS = 50
const MAX_TEXTS_CHARS = 12_000
const MAX_DOC_CHARS = 50_000
const MAX_DOC_BLOCKS = 200
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// POST /api/translate — explicit "Translate" button for the bilingual editors.
// Open to approved journalists and super-admins; it only returns text, nothing is saved.
export const POST = async (request: NextRequest): Promise<NextResponse> => {
  let actor: string
  const journalist = await validateAccessToken(request, db)
  if (journalist.ok) {
    const approved = await requireApprovedUser(journalist.userId)
    if (!approved.ok) return approved.response
    actor = `user:${journalist.userId}`
  } else {
    const admin = await validateSuperAdminAccessToken(request, db)
    if (!admin.ok) return journalist.response
    actor = `admin:${admin.superAdminId}`
  }

  const parsed = await parseJsonBody<unknown>(request)
  if (!parsed.ok) return parsed.response
  const body = parsed.body
  if (!isRecord(body)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const from = body.from
  if (from !== 'id' && from !== 'en') {
    return NextResponse.json({ error: "from must be 'id' or 'en'" }, { status: 400 })
  }
  const hasText = body.text !== undefined
  const hasTexts = body.texts !== undefined
  const hasContent = body.content !== undefined
  if ([hasText, hasTexts, hasContent].filter(Boolean).length !== 1) {
    return NextResponse.json({ error: 'Send exactly one of text, texts or content' }, { status: 400 })
  }

  if (hasTexts) {
    const texts = body.texts
    if (!Array.isArray(texts) || texts.length === 0 || texts.some((entry) => typeof entry !== 'string')) {
      return NextResponse.json({ error: 'texts must be a non-empty array of strings' }, { status: 400 })
    }
    const total = (texts as string[]).reduce((sum, entry) => sum + entry.length, 0)
    if (texts.length > MAX_TEXTS || total > MAX_TEXTS_CHARS) {
      return NextResponse.json(
        { error: `Too much text to translate at once (max ${MAX_TEXTS} paragraphs / ${MAX_TEXTS_CHARS} characters)` },
        { status: 400 },
      )
    }
  } else if (hasText) {
    if (typeof body.text !== 'string') return NextResponse.json({ error: 'text must be a string' }, { status: 400 })
    if (body.text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: `Text is too long (max ${MAX_TEXT_CHARS} characters)` }, { status: 400 })
    }
  } else {
    const { blocks, characters } = measureContent(body.content)
    if (characters > MAX_DOC_CHARS || blocks > MAX_DOC_BLOCKS) {
      return NextResponse.json(
        { error: `Content is too long to translate at once (max ${MAX_DOC_CHARS} characters / ${MAX_DOC_BLOCKS} paragraphs)` },
        { status: 400 },
      )
    }
  }

  if (!isTranslationConfigured()) {
    return NextResponse.json({ error: 'Auto-translation is not available right now. Please write the text yourself.' }, { status: 503 })
  }
  if (!allowRequest(actor, RATE_LIMIT, RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many translation requests — wait a minute and try again' }, { status: 429 })
  }

  if (hasTexts) {
    const result = await translatePlainTexts(body.texts as string[], from)
    if (!result.ok) {
      return NextResponse.json({ error: 'The translation service did not respond. Please try again.' }, { status: 502 })
    }
    return NextResponse.json<TranslateTextsResponse>({ texts: result.texts })
  }

  if (hasText) {
    const result = await translatePlainText(body.text as string, from)
    if (!result.ok) {
      return NextResponse.json({ error: 'The translation service did not respond. Please try again.' }, { status: 502 })
    }
    return NextResponse.json<TranslateTextResponse>({ text: result.text })
  }

  const result = await translateDocument(body.content, from)
  if (!result.ok) {
    return NextResponse.json({ error: 'The translation service did not respond. Please try again.' }, { status: 502 })
  }
  return NextResponse.json<TranslateContentResponse>({
    content: result.content,
    totalBlocks: result.totalBlocks,
    failedBlocks: result.failedBlocks,
  })
}
