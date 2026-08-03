'use client'

import { useState } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
import { toast } from 'vibe-toast'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { useAllArticlesAdmin, useDeleteArticleAsAdmin } from '@/services/article/article.queries'
import { useArticlesStream } from '@/services/article/article.sse'
import { Card, CardContent } from '@/components/ui/card'
import ArticleTable from '@/components/dashboard/ArticleTable'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import ArticlePreviewDialog from '@/components/dashboard/ArticlePreviewDialog'
import type { ArticleDto } from '@/services/article/article.dto'

const SuperAdminDashboardView = () => {
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data: articles, isLoading } = useAllArticlesAdmin(bootstrapped)
  const deleteArticle = useDeleteArticleAsAdmin()
  useArticlesStream(bootstrapped)

  const [pendingDelete, setPendingDelete] = useState<ArticleDto | null>(null)
  const [previewArticle, setPreviewArticle] = useState<ArticleDto | null>(null)

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
        <h1 className="mt-1.5 font-editorial text-4xl tracking-tight text-foreground sm:text-[2.75rem]">
          All Articles
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review, publish, or remove any article across the newsroom.
        </p>
      </div>

      <div className="animate-in fade-in-0 slide-in-from-bottom-2 mt-10 duration-700">
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
    </div>
  )
}

export default SuperAdminDashboardView
