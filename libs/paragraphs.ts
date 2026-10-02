/** "A\n\nB" → ["A", "B"]; any run of blank lines separates paragraphs, single line breaks stay inside one. */
export const splitParagraphs = (text: string): string[] =>
  text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

export const joinParagraphs = (paragraphs: string[]): string => paragraphs.join('\n\n')
