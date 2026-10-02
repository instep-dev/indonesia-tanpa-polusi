'use client'

import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import sanitizeHtml from 'sanitize-html'

const EXTENSIONS = [StarterKit, Image]

// Pure-JS sanitizer (no DOM/jsdom needed) so this renders identically on the
// server and the client — a DOM-based sanitizer here caused a hydration
// mismatch, since it silently failed during SSR but worked in the browser.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
}

type ArticleContentPreviewProps = {
  content: unknown
  /** Shown when there is no text. Defaults to English (used by the dashboards). */
  emptyText?: string
  /** Shown when the content can't be rendered. */
  errorText?: string
}

const ArticleContentPreview = ({
  content,
  emptyText = 'No content.',
  errorText = 'Could not render content.',
}: ArticleContentPreviewProps) => {
  const hasContent = content && typeof content === 'object' && Object.keys(content).length > 0
  if (!hasContent) {
    return <p className="text-sm text-foreground/40">{emptyText}</p>
  }

  let html = ''
  try {
    const rawHtml = generateHTML(content as Parameters<typeof generateHTML>[0], EXTENSIONS)
    html = sanitizeHtml(rawHtml, SANITIZE_OPTIONS)
  } catch {
    return <p className="text-sm text-red-500">{errorText}</p>
  }

  return (
    // eslint-disable-next-line react/no-danger
    <div className="prose prose-neutral max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default ArticleContentPreview
