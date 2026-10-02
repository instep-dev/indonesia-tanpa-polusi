'use client'

import { useState } from 'react'
import { Translate } from '@phosphor-icons/react'
import { useTranslateTexts } from '@/services/translate/translate.queries'
import { joinParagraphs, splitParagraphs } from '@/libs/paragraphs'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

// Two inputs side by side — Indonesian and English — that the admin fills in
// by hand. The Translate button is only a shortcut: it fills the OTHER side
// from the one already written, asks before overwriting text, and never saves.
// (Layout pattern from the sibling `medivara` project's BilingualInput; the
// Translate button is new.)

export type BilingualValue = { id: string; en: string }
type Locale = keyof BilingualValue

type BilingualFieldProps = {
  idPrefix: string
  /** `paragraphs` = several paragraphs in one box, translated paragraph by paragraph. */
  kind: 'text' | 'textarea' | 'paragraphs'
  value: BilingualValue
  onChange: (next: BilingualValue) => void
  rows?: number
  disabled?: boolean
}

const LANGUAGES: Array<{ code: Locale; label: string; name: string; accent: string }> = [
  { code: 'id', label: 'Indonesian (ID)', name: 'Indonesian', accent: 'border-l-[#4E88C9]' },
  { code: 'en', label: 'English (EN)', name: 'English', accent: 'border-l-[#E0B800]' },
]

const otherOf = (code: Locale): Locale => (code === 'id' ? 'en' : 'id')
const nameOf = (code: Locale): string => LANGUAGES.find((language) => language.code === code)?.name ?? code

const BilingualField = ({ idPrefix, kind, value, onChange, rows, disabled = false }: BilingualFieldProps) => {
  const translate = useTranslateTexts()
  const [confirmTarget, setConfirmTarget] = useState<Locale | null>(null)

  const sameText = value.id.trim().length > 3 && value.id.trim() === value.en.trim()

  const translateInto = async (target: Locale) => {
    const from = otherOf(target)
    const source = value[from]
    if (!source.trim()) return

    try {
      const texts = kind === 'paragraphs' ? splitParagraphs(source) : [source]
      const translated = await translate.mutateAsync({ from, texts })
      onChange({ ...value, [target]: kind === 'paragraphs' ? joinParagraphs(translated) : translated[0] })
    } catch {
      // The hook already toasted the error; the text the author typed is untouched.
    }
  }

  const requestTranslate = (target: Locale) => {
    if (value[target].trim()) setConfirmTarget(target)
    else void translateInto(target)
  }

  return (
    <div className="space-y-2">
      <div className="grid gap-3 lg:grid-cols-2">
        {LANGUAGES.map(({ code, label, accent }) => {
          const inputId = `${idPrefix}-${code}`
          const source = otherOf(code)
          const common = {
            id: inputId,
            value: value[code],
            disabled,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              onChange({ ...value, [code]: e.target.value }),
          }

          return (
            <div key={code} className={`space-y-1.5 border-l-2 pl-3 ${accent}`}>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={inputId} className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
                  {label}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={disabled || translate.isPending || !value[source].trim()}
                  onClick={() => requestTranslate(code)}
                >
                  <Translate />
                  {translate.isPending ? 'Translating…' : `Translate from ${nameOf(source)}`}
                </Button>
              </div>
              {kind === 'text' ? (
                <Input className="h-9" {...common} />
              ) : (
                <Textarea rows={rows ?? (kind === 'paragraphs' ? 9 : 4)} {...common} />
              )}
            </div>
          )
        })}
      </div>

      {sameText && (
        <p className="text-xs text-[#956400]">
          Both languages contain the same text — translate it or edit one side.
        </p>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={`Replace the ${confirmTarget ? nameOf(confirmTarget) : ''} text?`}
        description={`It will be overwritten with a new translation of the ${confirmTarget ? nameOf(otherOf(confirmTarget)) : ''} text. Nothing is saved until you press Save.`}
        confirmLabel="Replace with translation"
        isPending={translate.isPending}
        onConfirm={() => {
          const target = confirmTarget
          setConfirmTarget(null)
          if (target) void translateInto(target)
        }}
      />
    </div>
  )
}

export default BilingualField
