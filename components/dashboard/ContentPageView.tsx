'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'vibe-toast'
import { ArrowLeft, Eye } from '@phosphor-icons/react'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import {
  useCreatePreviewLink,
  useSaveSiteContent,
  useSaveSiteDrafts,
  useSiteContentPage,
} from '@/services/site-content/site-content.queries'
import type { SiteContentResponse } from '@/services/site-content/site-content.dto'
import {
  initialValue,
  planPublish,
  planSaveDraft,
  previewPathFor,
  unpublishedKeys,
  unsavedKeys,
} from '@/libs/contentDraftState'
import type { FieldValue } from '@/libs/contentDraftState'
import { getContentPage } from '@/data/content-registry'
import type { PageDef } from '@/data/content-registry'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import ContentFieldEditor from '@/components/dashboard/ContentFieldEditor'
import type { FieldDraft } from '@/components/dashboard/ContentFieldEditor'
import ContentListEditor from '@/components/dashboard/ContentListEditor'
import RegionNamesEditor from '@/components/dashboard/RegionNamesEditor'
import RecentActivityPanel from '@/components/dashboard/RecentActivityPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Values = Record<string, FieldDraft>

type ContentPageEditorProps = { page: PageDef; data: SiteContentResponse }

const ContentPageEditor = ({ page, data }: ContentPageEditorProps) => {
  const saveDrafts = useSaveSiteDrafts(page.slug)
  const publish = useSaveSiteContent(page.slug)
  const createPreview = useCreatePreviewLink()

  const meta = useMemo(() => new Map(data.fields.map((field) => [field.key, field])), [data])
  const fields = useMemo(() => page.sections.flatMap((section) => section.fields), [page])

  // Per field: the published value, the built-in default, and an unpublished draft (if any).
  const base = useMemo(
    () =>
      fields.map((field) => {
        const stored = meta.get(field.key)
        const defaults: FieldValue = { valueId: stored?.defaultId ?? '', valueEn: stored?.defaultEn ?? '' }
        const published: FieldValue = {
          valueId: stored?.valueId ?? defaults.valueId,
          valueEn: stored?.valueEn ?? defaults.valueEn,
        }
        const draft = stored?.draft ?? null
        return { field, defaults, published, draft, initial: initialValue(published, draft, defaults) }
      }),
    [fields, meta],
  )

  const [values, setValues] = useState<Values>(() => Object.fromEntries(base.map((entry) => [entry.field.key, entry.initial])))

  const states = base.map((entry) => ({
    field: entry.field,
    local: values[entry.field.key],
    initial: entry.initial,
    published: entry.published,
    defaults: entry.defaults,
    hasDraft: entry.draft !== null,
  }))
  const unsaved = unsavedKeys(states)
  const unpublished = unpublishedKeys(states)
  const dirty = unsaved.length > 0
  const busy = saveDrafts.isPending || publish.isPending || createPreview.isPending

  // Warn before a refresh, an in-app link or the Back button throws away unsaved edits.
  useUnsavedChangesGuard(dirty)

  const draftPlan = planSaveDraft(states)

  const handleSaveDraft = (onDone?: () => void) =>
    saveDrafts.mutate(
      { save: draftPlan.toSave, discard: draftPlan.toDiscard },
      {
        onSuccess: () => {
          toast.success('Draft saved — only visible in preview, not on the public site')
          onDone?.()
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save the draft')),
      },
    )

  const handlePublish = () => {
    const plan = planPublish(states)
    publish.mutate(
      { fields: plan.toPublish, clearDrafts: plan.clearDrafts },
      {
        onSuccess: () => toast.success('Published — the public site is updated'),
        onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to publish')),
      },
    )
  }

  // Opens the public page with the drafts applied. The window is opened synchronously
  // (inside the click) so the browser doesn't treat it as a pop-up, then pointed at the link.
  const openPreview = (locale: 'en' | 'id') => {
    const tab = window.open('', '_blank')
    createPreview.mutate(previewPathFor(page.slug, locale), {
      onSuccess: (url) => {
        if (tab) tab.location.href = url
        else window.location.href = url
      },
      onError: (error) => {
        tab?.close()
        toast.error(getApiErrorMessage(error, 'Could not open the preview'))
      },
    })
  }

  // Preview shows what is SAVED, so unsaved typing is saved as a draft first.
  const handlePreview = (locale: 'en' | 'id') => {
    if (draftPlan.toSave.length === 0 && draftPlan.toDiscard.length === 0 && !dirty) return openPreview(locale)
    handleSaveDraft(() => openPreview(locale))
  }

  const statusText = dirty
    ? `${unsaved.length} unsaved change${unsaved.length > 1 ? 's' : ''}`
    : unpublished.length > 0
      ? `${unpublished.length} draft change${unpublished.length > 1 ? 's' : ''} not published yet`
      : 'Everything is published'

  return (
    <>
      <div className="sticky top-14 z-30 -mx-6 mt-8 border-y bg-background/90 px-6 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{statusText}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="lg"
              disabled={!dirty || busy}
              onClick={() => setValues(Object.fromEntries(base.map((entry) => [entry.field.key, entry.initial])))}
            >
              Discard
            </Button>
            <Button variant="outline" size="lg" disabled={busy} onClick={() => handlePreview('en')}>
              <Eye /> Preview EN
            </Button>
            <Button variant="outline" size="lg" disabled={busy} onClick={() => handlePreview('id')}>
              <Eye /> Preview ID
            </Button>
            <Button variant="outline" size="lg" disabled={busy || !dirty} onClick={() => handleSaveDraft()}>
              {saveDrafts.isPending ? 'Saving…' : 'Save draft'}
            </Button>
            <Button size="lg" disabled={busy || unpublished.length === 0} onClick={handlePublish}>
              {publish.isPending ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {page.sections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
              {section.description && <CardDescription>{section.description}</CardDescription>}
            </CardHeader>
            <CardContent className="divide-y">
              {section.fields.map((field) => {
                const entry = base.find((candidate) => candidate.field.key === field.key)
                const stored = meta.get(field.key)
                if (!entry) return null
                const now = values[field.key]
                return (
                  <ContentFieldEditor
                    key={field.key}
                    field={field}
                    draft={now}
                    defaults={entry.defaults}
                    customized={stored?.valueId != null || stored?.valueEn != null}
                    dirty={unsaved.includes(field.key)}
                    hasDraft={entry.draft !== null || unpublished.includes(field.key)}
                    lastEdit={stored?.lastEdit ?? null}
                    pageDirty={dirty}
                    onChange={(next) => setValues((current) => ({ ...current, [field.key]: next }))}
                  />
                )
              })}
            </CardContent>
          </Card>
        ))}

        {page.collections.map((collection) => (
          <ContentListEditor key={collection.id} collection={collection} />
        ))}

        {page.showRegionNames && <RegionNamesEditor />}

        <RecentActivityPanel pageSlug={page.slug} pageDirty={dirty} />
      </div>
    </>
  )
}

const ContentPageView = ({ slug }: { slug: string }) => {
  const page = getContentPage(slug)
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useSiteContentPage(slug, bootstrapped && !!page)

  if (!bootstrapped) return null

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <Link
          href="/super-admin/content"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All pages
        </Link>
        <h1 className="mt-4 font-tilt-warp text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
          {page?.title ?? 'Page not found'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {page?.description ?? 'This content page does not exist.'}
        </p>
      </div>

      {page &&
        (isLoading ? (
          <div className="mt-10 space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        ) : isError || !data ? (
          <Card className="mt-10 border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="font-medium text-foreground">Couldn&apos;t load this page&apos;s content</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Re-mounted after every save/refetch so the drafts restart from what is stored.
          <ContentPageEditor key={dataUpdatedAt} page={page} data={data} />
        ))}
    </div>
  )
}

export default ContentPageView
