'use client'

import { useState } from 'react'
import { toast } from 'vibe-toast'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { useRestoreRevision } from '@/services/content-revision/content-revision.queries'
import type { ContentRevisionDto } from '@/services/content-revision/content-revision.dto'
import { ACTION_LABELS, diffText, isRestorable, snapshotText } from '@/libs/revisionText'
import { timeAgo } from '@/libs/timeAgo'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type RevisionListProps = {
  revisions: ContentRevisionDto[]
  /** Heading for each entry (e.g. the field's name); the field history dialog leaves it out. */
  describe?: (revision: ContentRevisionDto) => string
  /** Show a word-level diff against the previous version of the same thing. */
  showDiff?: boolean
  /** Unsaved edits on the page are lost when a restore reloads it. */
  pageDirty?: boolean
  onRestored?: () => void
}

// One list used by both the per-field History dialog and the page's Recent activity panel.
const RevisionList = ({ revisions, describe, showDiff = false, pageDirty = false, onRestored }: RevisionListProps) => {
  const restore = useRestoreRevision()
  const [pending, setPending] = useState<ContentRevisionDto | null>(null)

  const handleRestore = () => {
    if (!pending) return
    restore.mutate(pending.id, {
      onSuccess: () => {
        toast.success('Restored — the public site is updated')
        setPending(null)
        onRestored?.()
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, 'Could not restore this version'))
        setPending(null)
      },
    })
  }

  if (revisions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No changes recorded yet.</p>
  }

  return (
    <>
      <ul className="divide-y">
        {revisions.map((revision, index) => {
          // Revisions are newest first, so the previous version of this target is the next older entry for it.
          const previous = revisions.slice(index + 1).find((older) => older.kind === revision.kind && older.targetKey === revision.targetKey)
          const isCurrent = !revisions.slice(0, index).some((newer) => newer.kind === revision.kind && newer.targetKey === revision.targetKey)
          const parts = showDiff ? diffText(previous ? snapshotText(previous) : '', snapshotText(revision)) : []

          return (
            <li key={revision.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {describe && <span className="font-medium">{describe(revision)}</span>}
                <Badge variant="secondary" className="font-mono text-[10px] tracking-[0.06em] uppercase">
                  {ACTION_LABELS[revision.action]}
                </Badge>
                <span className="text-muted-foreground">
                  {revision.createdByName} · {timeAgo(revision.createdAt)}
                </span>
                <span className="ml-auto">
                  {isCurrent ? (
                    <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground uppercase">Current</span>
                  ) : (
                    isRestorable(revision) && (
                      <Button size="xs" variant="outline" disabled={restore.isPending} onClick={() => setPending(revision)}>
                        <ArrowCounterClockwise /> Restore this version
                      </Button>
                    )
                  )}
                </span>
              </div>
              {showDiff && (
                <p className="rounded-md bg-muted/40 p-2.5 text-xs leading-5 whitespace-pre-wrap">
                  {parts.map((part, i) =>
                    part.added ? (
                      <ins key={i} className="bg-[#EDF3EC] text-[#346538] no-underline">{part.text}</ins>
                    ) : part.removed ? (
                      <del key={i} className="bg-[#FDEBEC] text-[#9F2F2D]">{part.text}</del>
                    ) : (
                      <span key={i}>{part.text}</span>
                    ),
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        title="Restore this version?"
        description={`It replaces what the website shows now (the current version stays in history).${pageDirty ? ' Restoring reloads this page, so your unsaved changes on it will be lost.' : ''}`}
        confirmLabel="Restore"
        isPending={restore.isPending}
        onConfirm={handleRestore}
      />
    </>
  )
}

export default RevisionList
