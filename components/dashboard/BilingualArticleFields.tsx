'use client'

import { useState } from 'react'
import { Translate } from '@phosphor-icons/react'
import { toast } from 'vibe-toast'
import { useTranslateContent, useTranslateTexts } from '@/services/translate/translate.queries'
import { hasContent } from '@/libs/tiptapText'
import BilingualField from '@/components/dashboard/BilingualField'
import ArticleContentPreview from '@/components/dashboard/ArticleContentPreview'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import TiptapEditor from '@/components/dashboard/TiptapEditor'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

// Title, excerpt and content in BOTH languages, side by side. The author can
// write either (or both) by hand; "Translate" only fills the other side from the
// one already written, asks before overwriting, and never saves by itself.

export type BilingualArticleValues = {
  titleId: string
  titleEn: string
  excerptId: string
  excerptEn: string
  contentId: unknown
  contentEn: unknown
}

type Locale = 'id' | 'en'

type BilingualArticleFieldsProps = {
  values: BilingualArticleValues
  onChange: (next: BilingualArticleValues) => void
  /** Read-only (article locked for editing): editors become previews. */
  disabled?: boolean
}

const NAMES: Record<Locale, string> = { id: 'Indonesian', en: 'English' }
const PLACEHOLDERS: Record<Locale, string> = {
  id: 'Tulis isi artikel di sini...',
  en: 'Write the article here...',
}
const ACCENTS: Record<Locale, string> = { id: 'border-l-[#4E88C9]', en: 'border-l-[#E0B800]' }

const otherOf = (locale: Locale): Locale => (locale === 'id' ? 'en' : 'id')

const titleOf = (v: BilingualArticleValues, l: Locale) => (l === 'id' ? v.titleId : v.titleEn)
const excerptOf = (v: BilingualArticleValues, l: Locale) => (l === 'id' ? v.excerptId : v.excerptEn)
const contentOf = (v: BilingualArticleValues, l: Locale) => (l === 'id' ? v.contentId : v.contentEn)

const withTexts = (v: BilingualArticleValues, l: Locale, title: string, excerpt: string): BilingualArticleValues =>
  l === 'id' ? { ...v, titleId: title, excerptId: excerpt } : { ...v, titleEn: title, excerptEn: excerpt }
const withContent = (v: BilingualArticleValues, l: Locale, content: unknown): BilingualArticleValues =>
  l === 'id' ? { ...v, contentId: content } : { ...v, contentEn: content }

type Pending = { scope: 'all' | 'content'; target: Locale }

const BilingualArticleFields = ({ values, onChange, disabled = false }: BilingualArticleFieldsProps) => {
  const translateTexts = useTranslateTexts()
  const translateContent = useTranslateContent()
  const [pending, setPending] = useState<Pending | null>(null)
  const busy = translateTexts.isPending || translateContent.isPending

  const warnAboutFailedBlocks = (failedBlocks: number) => {
    if (failedBlocks > 0) {
      toast.warning(
        `${failedBlocks} paragraph${failedBlocks > 1 ? 's' : ''} could not be translated and kept the original text — please check the translation.`,
      )
    }
  }

  const translateContentInto = async (target: Locale) => {
    const from = otherOf(target)
    try {
      const result = await translateContent.mutateAsync({ from, content: contentOf(values, from) })
      onChange(withContent(values, target, result.content))
      warnAboutFailedBlocks(result.failedBlocks)
    } catch {
      // The hook already showed the error; nothing the author typed was changed.
    }
  }

  const translateAllInto = async (target: Locale) => {
    const from = otherOf(target)
    const sourceContent = contentOf(values, from)
    try {
      const [texts, content] = await Promise.all([
        translateTexts.mutateAsync({ from, texts: [titleOf(values, from), excerptOf(values, from)] }),
        hasContent(sourceContent) ? translateContent.mutateAsync({ from, content: sourceContent }) : Promise.resolve(null),
      ])
      const withText = withTexts(values, target, texts[0], texts[1])
      onChange(content ? withContent(withText, target, content.content) : withText)
      warnAboutFailedBlocks(content?.failedBlocks ?? 0)
    } catch {
      // The hook already showed the error; nothing the author typed was changed.
    }
  }

  const targetHasContent = (target: Locale, scope: Pending['scope']): boolean =>
    scope === 'content'
      ? hasContent(contentOf(values, target))
      : !!(titleOf(values, target).trim() || excerptOf(values, target).trim() || hasContent(contentOf(values, target)))

  const request = (scope: Pending['scope'], target: Locale) => {
    if (targetHasContent(target, scope)) {
      setPending({ scope, target })
      return
    }
    void (scope === 'all' ? translateAllInto(target) : translateContentInto(target))
  }

  const sourceHasAnything = (from: Locale) =>
    !!(titleOf(values, from).trim() || excerptOf(values, from).trim() || hasContent(contentOf(values, from)))

  return (
    <div className="flex flex-col gap-7">
      {!disabled && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
          <p className="mr-auto text-sm text-muted-foreground">
            Write in either language (or both). Short on time? Let the translator fill in the other one.
          </p>
          {(['en', 'id'] as const).map((target) => (
            <Button
              key={target}
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || !sourceHasAnything(otherOf(target))}
              onClick={() => request('all', target)}
            >
              <Translate /> {busy ? 'Translating…' : `Translate everything → ${NAMES[target]}`}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label>Title</Label>
        <BilingualField
          idPrefix="article-title"
          kind="text"
          disabled={disabled}
          value={{ id: values.titleId, en: values.titleEn }}
          onChange={(next) => onChange({ ...values, titleId: next.id, titleEn: next.en })}
        />
      </div>

      <div className="space-y-2">
        <Label>Excerpt</Label>
        <BilingualField
          idPrefix="article-excerpt"
          kind="textarea"
          rows={3}
          disabled={disabled}
          value={{ id: values.excerptId, en: values.excerptEn }}
          onChange={(next) => onChange({ ...values, excerptId: next.id, excerptEn: next.en })}
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <div className="grid gap-4 lg:grid-cols-2">
          {(['id', 'en'] as const).map((locale) => {
            const source = otherOf(locale)
            return (
              <div key={locale} className={`min-w-0 space-y-2 border-l-2 pl-3 ${ACCENTS[locale]}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                    {NAMES[locale]} ({locale.toUpperCase()})
                  </span>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={busy || !hasContent(contentOf(values, source))}
                      onClick={() => request('content', locale)}
                    >
                      <Translate />
                      {translateContent.isPending ? 'Translating…' : `Translate from ${NAMES[source]}`}
                    </Button>
                  )}
                </div>
                {disabled ? (
                  <div className="rounded-lg border p-4">
                    <ArticleContentPreview content={contentOf(values, locale)} />
                  </div>
                ) : (
                  <TiptapEditor
                    content={contentOf(values, locale)}
                    onChange={(content) => onChange(withContent(values, locale, content))}
                    placeholder={PLACEHOLDERS[locale]}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title={`Replace the ${pending ? NAMES[pending.target] : ''} ${pending?.scope === 'content' ? 'content' : 'version'}?`}
        description={`It will be overwritten with a new translation of the ${pending ? NAMES[otherOf(pending.target)] : ''} text. Nothing is saved until you press Save.`}
        confirmLabel="Replace with translation"
        isPending={busy}
        onConfirm={() => {
          const current = pending
          setPending(null)
          if (!current) return
          void (current.scope === 'all' ? translateAllInto(current.target) : translateContentInto(current.target))
        }}
      />
    </div>
  )
}

export default BilingualArticleFields
