'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'vibe-toast'
import { Warning, ArrowLeft, Trash, Eye } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import ArticleStatusBadge from '@/components/dashboard/ArticleStatusBadge'
import ArticleContentPreview from '@/components/dashboard/ArticleContentPreview'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import ArticlePreviewDialog from '@/components/dashboard/ArticlePreviewDialog'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import {
  useArticle,
  useReviewArticle,
  useDeleteArticleAsAdmin,
} from '@/services/article/article.queries'

const TRANSLATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  DONE: 'Done',
  FAILED: 'Failed',
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const ArticleReviewView = ({ articleId }: { articleId: string }) => {
  const router = useRouter()
  const bootstrapped = superAdminAuthStore((s) => s.bootstrapped)
  const { data: article, isLoading } = useArticle(articleId, bootstrapped)
  const reviewArticle = useReviewArticle(articleId)
  const deleteArticle = useDeleteArticleAsAdmin()

  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  if (isLoading || !article) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-10 sm:px-8 sm:py-14">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const handleApprove = async () => {
    try {
      await reviewArticle.mutateAsync({ action: 'approve' })
      toast.success('Article approved and published')
      router.push('/super-admin/dashboard')
    } catch {
      toast.error('Failed to approve article')
    }
  }

  const handleReject = async () => {
    try {
      await reviewArticle.mutateAsync({ action: 'reject', rejectionReason })
      toast.success('Article rejected')
      router.push('/super-admin/dashboard')
    } catch {
      toast.error('Failed to reject article')
    }
  }

  const confirmDelete = () => {
    deleteArticle.mutate(article.id, {
      onSuccess: () => {
        toast.success('Article deleted')
        router.push('/super-admin/dashboard')
      },
      onError: () => toast.error('Failed to delete article'),
    })
  }

  const articleTitle = (article.sourceLocale === 'id' ? article.titleId : article.titleEn) || 'This article'

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2.5 mb-3"
          render={
            <Link href="/super-admin/dashboard">
              <ArrowLeft className="size-3.5" /> Back
            </Link>
          }
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Review</p>
            <h1 className="mt-1.5 font-editorial text-4xl tracking-tight text-foreground">Review Article</h1>
          </div>
          <ArticleStatusBadge status={article.status} deletedAt={article.deletedAt} />
        </div>
      </div>

      {article.deletedAt && (
        <Alert className="mt-6 border-[#EAEAEA] bg-[#F2F1EE] text-[#4A4A47] [&_svg]:text-[#4A4A47]">
          <Trash size={16} />
          <AlertDescription className="text-[#4A4A47]/80">
            This article was deleted on {formatDateTime(article.deletedAt)}. It is hidden from the public
            site.
          </AlertDescription>
        </Alert>
      )}

      {!article.deletedAt && article.translationStatus === 'FAILED' && (
        <Alert className="mt-6 border-[#F3E4B5] bg-[#FBF3DB] text-[#956400] [&_svg]:text-[#956400]">
          <Warning size={16} />
          <AlertDescription className="text-[#956400]/80">
            Auto-translation failed. The {article.sourceLocale === 'id' ? 'English' : 'Indonesian'} version
            below is empty — reject this article and ask the author to translate it manually, or approve
            knowing one language will be blank on the site.
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 overflow-hidden duration-700">
        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.coverImage} alt="Cover" className="aspect-video w-full object-cover" />
        )}

        <CardContent className="flex flex-col gap-7">
          <div>
            <Label>Details</Label>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border bg-[#FBFBFA] p-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Slug</p>
                <p className="mt-0.5 font-mono text-xs break-all">{article.slug}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Author</p>
                <p className="mt-0.5">{article.author.name || article.author.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="mt-0.5">{article.region?.nameEn ?? 'General'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source language</p>
                <p className="mt-0.5">{article.sourceLocale === 'id' ? 'Bahasa Indonesia' : 'English'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Translation</p>
                <p className="mt-0.5">{TRANSLATION_STATUS_LABELS[article.translationStatus]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-0.5">{formatDateTime(article.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="mt-0.5">{formatDateTime(article.updatedAt)}</p>
              </div>
              {article.publishedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Published</p>
                  <p className="mt-0.5">{formatDateTime(article.publishedAt)}</p>
                </div>
              )}
              {article.rejectionReason && (
                <div className="col-span-full">
                  <p className="text-xs text-muted-foreground">Rejection reason</p>
                  <p className="mt-0.5">{article.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid gap-7 sm:grid-cols-2">
            <div>
              <Label>Bahasa Indonesia</Label>
              <h3 className="mt-2 font-editorial text-2xl tracking-tight text-foreground">
                {article.titleId || '—'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{article.excerptId || '—'}</p>
              <div className="mt-4">
                <ArticleContentPreview content={article.contentId} />
              </div>
            </div>

            <div>
              <Label>English</Label>
              <h3 className="mt-2 font-editorial text-2xl tracking-tight text-foreground">
                {article.titleEn || '—'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{article.excerptEn || '—'}</p>
              <div className="mt-4">
                <ArticleContentPreview content={article.contentEn} />
              </div>
            </div>
          </div>

          {article.images.length > 0 && (
            <>
              <Separator />
              <div>
                <Label>Gallery</Label>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {article.images.map((image) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={image.id}
                      src={image.url}
                      alt={image.caption ?? ''}
                      className="aspect-square w-full rounded-xl border object-cover"
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>

        {!article.deletedAt && (
          <div className="border-t px-6 py-4">
            {article.status !== 'PENDING_REVIEW' ? (
              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                  <Eye className="size-4" /> Preview
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setConfirmOpen(true)}
                  disabled={deleteArticle.isPending}
                  className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                >
                  <Trash className="size-4" /> Delete article
                </Button>
              </div>
            ) : !showRejectForm ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPreviewOpen(true)}>
                    <Eye className="size-4" /> Preview
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmOpen(true)}
                    disabled={deleteArticle.isPending || reviewArticle.isPending}
                    className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
                  >
                    <Trash className="size-4" /> Delete
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={reviewArticle.isPending}
                  >
                    Reject
                  </Button>
                  <Button onClick={handleApprove} disabled={reviewArticle.isPending}>
                    {reviewArticle.isPending ? 'Publishing...' : 'Approve & Publish'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Label htmlFor="rejectionReason">Rejection reason</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Let the author know what needs fixing..."
                />
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={reviewArticle.isPending || !rejectionReason.trim()}
                  >
                    {reviewArticle.isPending ? 'Rejecting...' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete article?"
        description={`"${articleTitle}" will be hidden from the public site.`}
        isPending={deleteArticle.isPending}
        onConfirm={confirmDelete}
      />

      <ArticlePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} article={article} />
    </div>
  )
}

export default ArticleReviewView
