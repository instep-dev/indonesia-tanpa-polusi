export type TranslateLocaleCode = 'id' | 'en'

/** Exactly one of `text`, `texts` (several fields/paragraphs at once) or `content` (Tiptap JSON) is sent. */
export type TranslateBody =
  | { from: TranslateLocaleCode; text: string }
  | { from: TranslateLocaleCode; texts: string[] }
  | { from: TranslateLocaleCode; content: unknown }

export type TranslateTextResponse = { text: string }

export type TranslateTextsResponse = { texts: string[] }

export type TranslateContentResponse = {
  content: unknown
  totalBlocks: number
  /** Blocks that could not be translated and kept their original text. */
  failedBlocks: number
}
