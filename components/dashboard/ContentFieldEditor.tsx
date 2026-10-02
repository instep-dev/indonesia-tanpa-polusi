'use client'

import type { FieldDef } from '@/data/content-registry'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { ClockCounterClockwise } from '@phosphor-icons/react'
import BilingualField from '@/components/dashboard/BilingualField'
import RevisionHistoryDialog from '@/components/dashboard/RevisionHistoryDialog'
import { timeAgo } from '@/libs/timeAgo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import SiteImageField from '@/components/dashboard/SiteImageField'
import VideoUrlField from '@/components/dashboard/VideoUrlField'

export type FieldDraft = { valueId: string; valueEn: string }

type ContentFieldEditorProps = {
  field: FieldDef
  draft: FieldDraft
  defaults: FieldDraft
  /** A stored override exists for this field. */
  customized: boolean
  /** The draft differs from what was last saved. */
  dirty: boolean
  /** This field differs from what is published (a saved draft, or typed changes). */
  hasDraft: boolean
  /** Who last changed this field in the CMS, and when. */
  lastEdit: { by: string; at: string } | null
  /** Some field on the page has unsaved edits (a restore would discard them). */
  pageDirty: boolean
  onChange: (draft: FieldDraft) => void
}

// One editable field of the public site. The control is picked from the
// registry's field type; localized fields get side-by-side ID / EN inputs.
const ContentFieldEditor = ({ field, draft, defaults, customized, dirty, hasDraft, lastEdit, pageDirty, onChange }: ContentFieldEditorProps) => {
  const [historyOpen, setHistoryOpen] = useState(false)
  const isDefault = draft.valueId === defaults.valueId && (!field.localized || draft.valueEn === defaults.valueEn)
  const inputId = `field-${field.key}`

  const renderControl = () => {
    if (field.type === 'image') {
      return (
        <SiteImageField
          value={draft.valueId}
          defaultValue={defaults.valueId}
          onChange={(valueId) => onChange({ ...draft, valueId })}
        />
      )
    }
    if (field.type === 'video') {
      return (
        <VideoUrlField
          value={draft.valueId}
          defaultValue={defaults.valueId}
          onChange={(valueId) => onChange({ ...draft, valueId })}
        />
      )
    }

    const renderInput = (code: 'valueId' | 'valueEn', id: string) =>
      field.type === 'textarea' || field.type === 'paragraphs' ? (
        <Textarea
          id={id}
          rows={field.type === 'paragraphs' ? 9 : 4}
          value={draft[code]}
          onChange={(e) => onChange({ ...draft, [code]: e.target.value })}
        />
      ) : (
        <Input
          id={id}
          className="h-9"
          value={draft[code]}
          onChange={(e) => onChange({ ...draft, [code]: e.target.value })}
        />
      )

    if (!field.localized) return renderInput('valueId', inputId)

    return (
      <BilingualField
        idPrefix={inputId}
        kind={field.type === 'textarea' || field.type === 'paragraphs' ? field.type : 'text'}
        value={{ id: draft.valueId, en: draft.valueEn }}
        onChange={(next) => onChange({ valueId: next.id, valueEn: next.en })}
      />
    )
  }

  return (
    <div className="space-y-2.5 py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={field.localized ? `${inputId}-id` : inputId} className="text-sm font-semibold">
          {field.label}
        </Label>
        {dirty ? (
          <Badge className="bg-[#E1F3FE] font-mono text-[10px] tracking-[0.06em] text-[#1F6C9F] uppercase hover:bg-[#E1F3FE]">
            Unsaved
          </Badge>
        ) : hasDraft ? (
          <Badge className="bg-[#FBF3DB] font-mono text-[10px] tracking-[0.06em] text-[#956400] uppercase hover:bg-[#FBF3DB]">
            Draft — not published
          </Badge>
        ) : customized ? (
          <Badge className="bg-[#EDF3EC] font-mono text-[10px] tracking-[0.06em] text-[#346538] uppercase hover:bg-[#EDF3EC]">
            Customized
          </Badge>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          {field.type !== 'image' && field.type !== 'video' && !isDefault && (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange(defaults)}>
              Use default
            </Button>
          )}
          <Button type="button" variant="ghost" size="xs" onClick={() => setHistoryOpen(true)}>
            <ClockCounterClockwise /> History
          </Button>
        </div>
      </div>
      {renderControl()}
      {lastEdit && (
        <p className="text-[11px] text-muted-foreground">
          Last edited by {lastEdit.by} · {timeAgo(lastEdit.at)}
        </p>
      )}
      <RevisionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        title={field.label}
        kind="field"
        targetKey={field.key}
        pageDirty={pageDirty}
      />
    </div>
  )
}

export default ContentFieldEditor
