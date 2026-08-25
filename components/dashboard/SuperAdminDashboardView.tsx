'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { ClipboardText, Plus, Trash, ArrowClockwise, MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'vibe-toast'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useAllArticlesAdmin, useDeleteArticleAsAdmin, useUpdateMainArticles } from '@/services/article/article.queries'
import { useArticlesStream } from '@/services/article/article.sse'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import ArticleTable from '@/components/dashboard/ArticleTable'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import ArticlePreviewDialog from '@/components/dashboard/ArticlePreviewDialog'
import type { ArticleDto } from '@/services/article/article.dto'

const SuperAdminDashboardView = () => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data: articles, isLoading } = useAllArticlesAdmin(bootstrapped)
  const deleteArticle = useDeleteArticleAsAdmin()
  const updateMainArticles = useUpdateMainArticles()
  useArticlesStream(bootstrapped)

  const [pendingDelete, setPendingDelete] = useState<ArticleDto | null>(null)
  const [previewArticle, setPreviewArticle] = useState<ArticleDto | null>(null)

  const [selectingSlot, setSelectingSlot] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const mainArticles = useMemo(() => {
    return articles?.filter((a) => a.isMain && a.status === 'PUBLISHED') ?? []
  }, [articles])

  const publishedArticles = useMemo(() => {
    return articles?.filter((a) => a.status === 'PUBLISHED') ?? []
  }, [articles])

  const filteredPublished = useMemo(() => {
    return publishedArticles.filter((a) => {
      const title = (a.sourceLocale === 'id' ? a.titleId : a.titleEn).toLowerCase()
      return title.includes(searchQuery.toLowerCase())
    })
  }, [publishedArticles, searchQuery])

  const handleRemoveMain = (slotIndex: number) => {
    const currentIds = [
      mainArticles[0]?.id || null,
      mainArticles[1]?.id || null,
      mainArticles[2]?.id || null,
    ]
    currentIds[slotIndex] = null
    const nextIds = currentIds.filter((id): id is string => id !== null)

    if (nextIds.length === 0) {
      toast.error('Minimal harus ada 1 artikel utama yang terpasang!')
      return
    }

    updateMainArticles.mutate(nextIds, {
      onSuccess: () => toast.success('Showcase article removed'),
      onError: () => toast.error('Failed to remove showcase article'),
    })
  }

  const handleAssignMain = (articleId: string) => {
    if (selectingSlot === null) return
    const currentIds = [
      mainArticles[0]?.id || null,
      mainArticles[1]?.id || null,
      mainArticles[2]?.id || null,
    ]
    currentIds[selectingSlot] = articleId
    const nextIds = currentIds.filter((id): id is string => id !== null)

    updateMainArticles.mutate(nextIds, {
      onSuccess: () => {
        toast.success('Showcase article updated')
        setSelectingSlot(null)
      },
      onError: () => toast.error('Failed to update showcase article'),
    })
  }

  if (!bootstrapped) return null

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteArticle.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success('Article deleted')
        setPendingDelete(null)
      },
      onError: () => toast.error('Failed to delete article'),
    })
  }

  const pendingTitle = pendingDelete
    ? (pendingDelete.sourceLocale === 'id' ? pendingDelete.titleId : pendingDelete.titleEn) ||
      'This article'
    : ''

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Review</p>
        <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
          All Articles
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, publish, or remove any article across the newsroom.
        </p>
      </div>

      {/* Main Articles Section */}
      <div className="mt-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <h2 className="font-tilt-warp text-2xl text-foreground">Main Showcase Articles</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose up to 3 published articles to display prominently on the homepage news section.
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((index) => {
            const article = mainArticles[index]
            const title = article
              ? (article.sourceLocale === 'id' ? article.titleId : article.titleEn)
              : null
            const image = article?.coverImage

            return (
              <Card key={index} className="overflow-hidden border border-dashed border-border flex flex-col justify-between h-[200px]">
                {article ? (
                  <div className="relative flex flex-col justify-between h-full bg-card p-4">
                    <div className="flex gap-3">
                      <div className="relative size-16 shrink-0 rounded-lg overflow-hidden border">
                        <Image
                          src={image || '/news1.jpg'}
                          alt={title || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] tracking-[0.06em] text-muted-foreground uppercase">
                          Slot {index + 1}
                        </span>
                        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mt-0.5 leading-tight">
                          {title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="xs"
                        className="flex-1 text-xs"
                        onClick={() => setSelectingSlot(index)}
                      >
                        <ArrowClockwise className="size-3" /> Change
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                        onClick={() => handleRemoveMain(index)}
                        disabled={updateMainArticles.isPending}
                      >
                        <Trash className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 h-full">
                    <span className="font-mono text-[9px] tracking-[0.06em] text-muted-foreground uppercase mb-1">
                      Slot {index + 1}
                    </span>
                    <p className="text-xs text-muted-foreground italic mb-3">No article assigned</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => setSelectingSlot(index)}
                    >
                      <Plus className="size-3.5" /> Assign Article
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-12 duration-700">
        <ArticleTable
          articles={articles ?? []}
          isLoading={isLoading}
          basePath="/super-admin/articles"
          onDelete={setPendingDelete}
          onPreview={setPreviewArticle}
          deletingId={deleteArticle.isPending ? (deleteArticle.variables ?? null) : null}
          emptyState={
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#F2F1EE]">
                  <ClipboardText className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">No articles yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Articles submitted by journalists will show up here.
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        />
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete article?"
        description={`"${pendingTitle}" will be hidden from the public site.`}
        isPending={deleteArticle.isPending}
        onConfirm={confirmDelete}
      />

      {previewArticle && (
        <ArticlePreviewDialog
          open={!!previewArticle}
          onOpenChange={(open) => !open && setPreviewArticle(null)}
          article={previewArticle}
        />
      )}

      <Dialog open={selectingSlot !== null} onOpenChange={(open) => !open && setSelectingSlot(null)}>
        <DialogContent 
          className="w-[90vw] max-w-[90vw]"
          style={{ maxWidth: '672px', width: '90vw' }}
        >
          <DialogHeader>
            <DialogTitle className="font-tilt-warp text-2xl">Select Article for Slot {selectingSlot !== null ? selectingSlot + 1 : ''}</DialogTitle>
            <DialogDescription>
              Choose a published article from the newsroom to display in the homepage showcase.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search published articles by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {filteredPublished.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-6 text-center">
                No published articles found matching &quot;{searchQuery}&quot;.
              </p>
            ) : (
              <div className="divide-y border rounded-xl overflow-y-auto max-h-[350px] bg-background font-sans">
                {filteredPublished.map((article) => {
                  const title = (article.sourceLocale === 'id' ? article.titleId : article.titleEn) || 'Untitled'
                  const isAssigned = mainArticles.some((m) => m.id === article.id)

                  return (
                    <div key={article.id} className="flex items-center justify-between gap-4 p-3.5 text-sm hover:bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {article.sourceLocale.toUpperCase()} • {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {isAssigned ? (
                        <span className="text-xs text-muted-foreground italic font-medium px-3">
                          Already Assigned
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignMain(article.id)}
                          disabled={updateMainArticles.isPending}
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SuperAdminDashboardView
