'use client'

import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { usePageRevisions } from '@/services/content-revision/content-revision.queries'
import type { ContentRevisionDto } from '@/services/content-revision/content-revision.dto'
import { collectionsById, fieldsByKey } from '@/data/content-registry'
import RevisionList from '@/components/dashboard/RevisionList'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// What a revision is about, in words an editor recognises.
const describeRevision = (revision: ContentRevisionDto): string => {
  if (revision.kind === 'field') return fieldsByKey.get(revision.targetKey)?.label ?? revision.targetKey
  if (revision.kind === 'region') return 'Region name'
  const collection = revision.collection ? collectionsById.get(revision.collection) : undefined
  return collection ? `${collection.title}${revision.kind === 'collection' ? ' (order)' : ''}` : 'List item'
}

const RecentActivityPanel = ({ pageSlug, pageDirty }: { pageSlug: string; pageDirty: boolean }) => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data, isLoading } = usePageRevisions(pageSlug, bootstrapped)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Every change to this page, who made it, and a way back to any earlier version.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : (
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              {data.length === 0 ? 'No changes yet' : `Show the latest ${data.length} change${data.length > 1 ? 's' : ''}`}
            </summary>
            <div className="mt-4">
              <RevisionList revisions={data} describe={describeRevision} pageDirty={pageDirty} />
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityPanel
