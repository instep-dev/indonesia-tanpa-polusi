'use client'

import { useTargetRevisions } from '@/services/content-revision/content-revision.queries'
import type { RevisionKind } from '@/services/content-revision/content-revision.dto'
import RevisionList from '@/components/dashboard/RevisionList'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

type RevisionHistoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  kind: RevisionKind
  targetKey: string
  pageDirty?: boolean
}

const RevisionHistoryDialog = ({ open, onOpenChange, title, kind, targetKey, pageDirty }: RevisionHistoryDialogProps) => {
  const { data, isLoading, isError } = useTargetRevisions(kind, targetKey, open)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>History — {title}</DialogTitle>
          <DialogDescription>Newest first. Green is added, red is removed compared with the version before.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : isError || !data ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Couldn&apos;t load the history.</p>
        ) : (
          <RevisionList revisions={data} showDiff pageDirty={pageDirty} onRestored={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  )
}

export default RevisionHistoryDialog
