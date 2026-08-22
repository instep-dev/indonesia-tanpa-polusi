'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Warning, Trash, ArrowLeft } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import RegionSelect from '@/components/dashboard/RegionSelect'
import CoverImageUploader from '@/components/dashboard/CoverImageUploader'
import ArticleGallery from '@/components/dashboard/ArticleGallery'
import ArticleStatusBadge from '@/components/dashboard/ArticleStatusBadge'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import TiptapEditor from '@/components/dashboard/TiptapEditor'
import { authStore } from '@/services/auth/auth.store'
import {
  useArticle,
  useUpdateArticle,
  useDeleteArticle,
  useSubmitArticleForReview,
} from '@/services/article/article.queries'

const EditArticleView = ({ articleId }: { articleId: string }) => {
  const router = useRouter()
  const bootstrapped = authStore((s) => s.bootstrapped)
  const { data: article, isLoading } = useArticle(articleId, bootstrapped)
  const updateArticle = useUpdateArticle(articleId)
  const deleteArticle = useDeleteArticle()
  const submitForReview = useSubmitArticleForReview(articleId)

  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [regionId, setRegionId] = useState<string | null>(null)
  const [content, setContent] = useState<unknown>({})
  const [reportUrl, setReportUrl] = useState('')
  const [pressReleaseUrl, setPressReleaseUrl] = useState('')
  const [visualUrl, setVisualUrl] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!article) return
    setTitle(article.sourceLocale === 'id' ? article.titleId : article.titleEn)
    setExcerpt(article.sourceLocale === 'id' ? article.excerptId : article.excerptEn)
    setRegionId(article.regionId)
    setContent(article.sourceLocale === 'id' ? article.contentId : article.contentEn)
    setReportUrl(article.reportUrl || '')
    setPressReleaseUrl(article.pressReleaseUrl || '')
    setVisualUrl(article.visualUrl || '')
  }, [article])

  if (isLoading || !article) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  const editable = article.status === 'DRAFT' || article.status === 'REJECTED'

  const handleSave = async () => {
    await updateArticle.mutateAsync({
      titleId: article.sourceLocale === 'id' ? title : undefined,
      titleEn: article.sourceLocale === 'en' ? title : undefined,
      excerptId: article.sourceLocale === 'id' ? excerpt : undefined,
      excerptEn: article.sourceLocale === 'en' ? excerpt : undefined,
      contentId: article.sourceLocale === 'id' ? content : undefined,
      contentEn: article.sourceLocale === 'en' ? content : undefined,
      regionId,
      reportUrl: reportUrl || null,
      pressReleaseUrl: pressReleaseUrl || null,
      visualUrl: visualUrl || null,
    })
  }

  const handleSubmitForReview = async () => {
    await handleSave()
    await submitForReview.mutateAsync()
  }

  const confirmDelete = async () => {
    await deleteArticle.mutateAsync(articleId)
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8 sm:py-14">
      <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2.5 mb-3"
          render={
            <Link href="/dashboard">
              <ArrowLeft className="size-3.5" /> Back
            </Link>
          }
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">Editing</p>
            <h1 className="mt-1.5 font-editorial text-4xl tracking-tight text-foreground">Edit Article</h1>
          </div>
          <ArticleStatusBadge status={article.status} />
        </div>
      </div>

      {article.status === 'REJECTED' && article.rejectionReason && (
        <Alert className="mt-6 border-[#F5D0CF] bg-[#FDEBEC] text-[#9F2F2D] [&_svg]:text-[#9F2F2D]">
          <Warning size={16} />
          <AlertTitle>Rejected — editing will resubmit for a fresh review.</AlertTitle>
          <AlertDescription className="text-[#9F2F2D]/80">{article.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {article.status === 'PENDING_REVIEW' && article.translationStatus === 'FAILED' && (
        <Alert className="mt-6 border-[#F3E4B5] bg-[#FBF3DB] text-[#956400] [&_svg]:text-[#956400]">
          <Warning size={16} />
          <AlertDescription className="text-[#956400]/80">
            Auto-translation failed for this article. A reviewer will need to fill in the other
            language manually.
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 duration-700">
        <CardContent className="flex flex-col gap-7">
          <div className="space-y-2">
            <Label htmlFor="title">Title ({article.sourceLocale.toUpperCase()})</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!editable} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt ({article.sourceLocale.toUpperCase()})</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={!editable}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <RegionSelect value={regionId} onChange={setRegionId} disabled={!editable} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reportUrl">Report Link (PDF)</Label>
              <Input
                id="reportUrl"
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                placeholder="https://..."
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pressReleaseUrl">Press Release Link</Label>
              <Input
                id="pressReleaseUrl"
                value={pressReleaseUrl}
                onChange={(e) => setPressReleaseUrl(e.target.value)}
                placeholder="https://..."
                disabled={!editable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visualUrl">Visual Gallery Link</Label>
              <Input
                id="visualUrl"
                value={visualUrl}
                onChange={(e) => setVisualUrl(e.target.value)}
                placeholder="https://..."
                disabled={!editable}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <CoverImageUploader
              value={article.coverImage}
              onChange={(url) => updateArticle.mutate({ coverImage: url })}
            />
          </div>

          <div className="space-y-2">
            <Label>Gallery</Label>
            <ArticleGallery articleId={articleId} images={article.images} editable={editable} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Content ({article.sourceLocale.toUpperCase()})</Label>
            {editable ? (
              <TiptapEditor content={content} onChange={setContent} />
            ) : (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                Content is locked while the article is {article.status.replace('_', ' ').toLowerCase()}.
              </div>
            )}
          </div>
        </CardContent>

        {editable && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(true)}
              disabled={article.status !== 'DRAFT' || deleteArticle.isPending}
              className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
            >
              <Trash className="size-4" /> Delete draft
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSave} disabled={updateArticle.isPending}>
                {updateArticle.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                onClick={handleSubmitForReview}
                disabled={submitForReview.isPending || updateArticle.isPending}
              >
                {submitForReview.isPending ? 'Submitting...' : 'Submit for Review'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete draft?"
        description="This cannot be undone."
        isPending={deleteArticle.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default EditArticleView
