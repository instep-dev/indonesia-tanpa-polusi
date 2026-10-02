// Pure helpers over Tiptap/ProseMirror JSON (no editor/DOM imports, so they are
// safe in client bundles and on the server).

export type TiptapNode = {
  type?: string
  text?: string
  content?: TiptapNode[]
  [key: string]: unknown
}

const isNode = (value: unknown): value is TiptapNode => typeof value === 'object' && value !== null

/** Inline nodes that can sit directly inside a text block. */
const INLINE_TYPES = new Set(['text', 'hardBreak'])

/** A text block holds only inline content with some real text (a paragraph, heading, ...). Code is never translated. */
export const isTextBlock = (node: TiptapNode): boolean =>
  node.type !== 'codeBlock' &&
  Array.isArray(node.content) &&
  node.content.length > 0 &&
  node.content.every((child) => INLINE_TYPES.has(child.type ?? '')) &&
  node.content.some((child) => child.type === 'text' && !!child.text?.trim())

/** Every text block in the document, in reading order. */
export const collectTextBlocks = (root: unknown): TiptapNode[] => {
  const blocks: TiptapNode[] = []
  const walk = (node: unknown) => {
    if (!isNode(node)) return
    if (isTextBlock(node)) {
      blocks.push(node)
      return
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(root)
  return blocks
}

/** True when the document has any visible text or an image (so "empty" means really empty). */
export const hasContent = (root: unknown): boolean => {
  const walk = (node: unknown): boolean => {
    if (!isNode(node)) return false
    if (node.type === 'image') return true
    if (node.type === 'text' && !!node.text?.trim()) return true
    return Array.isArray(node.content) && node.content.some(walk)
  }
  return walk(root)
}

/** Number of text blocks and their total characters (used to cap translation requests). */
export const measureContent = (root: unknown): { blocks: number; characters: number } => {
  const blocks = collectTextBlocks(root)
  const characters = blocks.reduce(
    (total, block) => total + (block.content ?? []).reduce((sum, child) => sum + (child.text?.length ?? 0), 0),
    0,
  )
  return { blocks: blocks.length, characters }
}
