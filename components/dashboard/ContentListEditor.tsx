'use client'

import { useState } from 'react'
import { toast } from 'vibe-toast'
import { ArrowCounterClockwise, ArrowDown, ArrowUp, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import {
  useContentItems,
  useCreateContentItems,
  useRemoveContentItem,
  useReorderContentItems,
  useRestoreContentItem,
  useUpdateContentItem,
} from '@/services/content-item/content-item.queries'
import type { ContentItemDto, ItemData } from '@/services/content-item/content-item.dto'
import type { CollectionDef } from '@/data/content-registry'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import ContentItemFormDialog from '@/components/dashboard/ContentItemFormDialog'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const TRUNCATE_AT = 110

const localizedText = (value: ItemData[string] | undefined): string =>
  typeof value === 'object' ? value.id || value.en : (value ?? '')

// A one-line summary of an item, derived from its collection's field definitions.
const summarize = (collection: CollectionDef, data: ItemData) => {
  const [first, second] = collection.itemFields.filter((field) => field.type !== 'image')
  const imageField = collection.itemFields.find((field) => field.type === 'image')
  const title = localizedText(first && data[first.name])
  const detail = localizedText(second && data[second.name])
  const image = imageField ? localizedText(data[imageField.name]) : ''
  return {
    title,
    detail: detail.length > TRUNCATE_AT ? `${detail.slice(0, TRUNCATE_AT)}…` : detail,
    image,
  }
}

type DialogState = { mode: 'create' } | { mode: 'edit'; item: ContentItemDto } | null

const ContentListEditor = ({ collection }: { collection: CollectionDef }) => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data, isLoading } = useContentItems(collection.id, bootstrapped)
  const create = useCreateContentItems(collection.id)
  const update = useUpdateContentItem(collection.id)
  const remove = useRemoveContentItem(collection.id)
  const reorder = useReorderContentItems(collection.id)
  const restore = useRestoreContentItem(collection.id)

  const [dialog, setDialog] = useState<DialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<ContentItemDto | null>(null)

  const items = data?.items ?? []
  const busy = create.isPending || update.isPending || remove.isPending || reorder.isPending || restore.isPending

  const handleCustomize = () => {
    if (!data) return
    create.mutate(
      { collection: collection.id, items: data.defaults },
      {
        onSuccess: () => toast.success('Built-in content copied — you can now edit it'),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to copy built-in content')),
      },
    )
  }

  const handleSubmit = (itemData: ItemData) => {
    const handlers = {
      onSuccess: () => {
        toast.success('Saved — the public site is updated')
        setDialog(null)
      },
      onError: (error: unknown) => toast.error(getApiErrorMessage(error, 'Failed to save')),
    }

    if (dialog?.mode === 'edit') {
      update.mutate({ id: dialog.item.id, data: itemData }, handlers)
    } else {
      create.mutate({ collection: collection.id, data: itemData }, handlers)
    }
  }

  const handleDelete = () => {
    if (!pendingDelete) return
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Removed')
        setPendingDelete(null)
      },
      onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to remove')),
    })
  }

  const handleRestore = (id: string) => {
    restore.mutate(id, {
      onSuccess: () => toast.success('Restored — the public site is updated'),
      onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to restore')),
    })
  }

  const handleMove = (index: number, delta: -1 | 1) => {
    const ids = items.map((item) => item.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(
      { collection: collection.id, ids },
      { onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to reorder')) },
    )
  }

  const renderRow = (rowData: ItemData, key: string, controls?: React.ReactNode) => {
    const { title, detail, image } = summarize(collection, rowData)
    return (
      <li key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-12 shrink-0 rounded-md border object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title || '(untitled)'}</p>
          {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
        </div>
        {controls}
      </li>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{collection.title}</CardTitle>
        {collection.description && <CardDescription>{collection.description}</CardDescription>}
        {data && !data.usingDefaults && (
          <CardAction>
            <Button
              size="lg"
              disabled={busy || items.length >= collection.maxItems}
              title={items.length >= collection.maxItems ? `At most ${collection.maxItems} items` : undefined}
              onClick={() => setDialog({ mode: 'create' })}
            >
              <Plus /> Add
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-24 w-full rounded-lg" />
        ) : data.usingDefaults ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
              <p className="font-medium">Showing the website&apos;s built-in content.</p>
              <p className="mt-1 text-muted-foreground">
                Copy it into the editor to start changing, adding, reordering or removing items.
              </p>
              <Button className="mt-3" size="lg" disabled={busy} onClick={handleCustomize}>
                {create.isPending ? 'Copying…' : 'Customize'}
              </Button>
            </div>
            <ul className="divide-y opacity-70">
              {data.defaults.map((defaultItem, index) => renderRow(defaultItem, `default-${index}`))}
            </ul>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item, index) =>
              renderRow(
                item.data,
                item.id,
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move up"
                    disabled={busy || index === 0}
                    onClick={() => handleMove(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Move down"
                    disabled={busy || index === items.length - 1}
                    onClick={() => handleMove(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Edit"
                    disabled={busy}
                    onClick={() => setDialog({ mode: 'edit', item })}
                  >
                    <PencilSimple className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Remove"
                    disabled={busy}
                    className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                    onClick={() => setPendingDelete(item)}
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>,
              ),
            )}
          </ul>
        )}

        {data && data.removed.length > 0 && (
          <details className="mt-5 rounded-lg border bg-muted/30 px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium">Recently removed ({data.removed.length})</summary>
            <ul className="mt-3 divide-y opacity-80">
              {data.removed.map((item) =>
                renderRow(
                  item.data,
                  `removed-${item.id}`,
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => handleRestore(item.id)}>
                    <ArrowCounterClockwise /> Restore
                  </Button>,
                ),
              )}
            </ul>
          </details>
        )}
      </CardContent>

      <ContentItemFormDialog
        collection={collection}
        initial={dialog?.mode === 'edit' ? dialog.item.data : null}
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        isPending={create.isPending || update.isPending}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove this item?"
        description="It disappears from the public website. If it was the last item, the built-in content is shown again."
        confirmLabel="Remove"
        isPending={remove.isPending}
        onConfirm={handleDelete}
      />
    </Card>
  )
}

export default ContentListEditor
