'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'vibe-toast'
import { Warning, Trash, ArrowLeft, Info } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import RegionSelect from '@/components/dashboard/RegionSelect'
import CoverImageUploader from '@/components/dashboard/CoverImageUploader'
import ArticleGallery from '@/components/dashboard/ArticleGallery'
import ArticleStatusBadge from '@/components/dashboard/ArticleStatusBadge'
import BilingualArticleFields from '@/components/dashboard/BilingualArticleFields'
import type { BilingualArticleValues } from '@/components/dashboard/BilingualArticleFields'
import ConfirmDialog from '@/components/dashboard/ConfirmDialog'
import { authStore } from '@/services/auth/auth.store'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import {
  useArticle,
  useUpdateArticle,
  useDeleteArticle,
  useSubmitArticleForReview,
} from '@/services/article/article.queries'
import type { ArticleDto } from '@/services/article/article.dto'
import { LOCALE_NAMES, missingLanguages } from '@/libs/articleLocale'
import { getApiErrorMessage } from '@/libs/getApiErrorMessage'

type EditArticleViewProps = {
  articleId: string
  /**
   * `journalist` (default): the author edits their own DRAFT/REJECTED article and can submit it.
   * `super-admin`: fixes any article — including published ones and translations — but cannot submit/delete drafts here.
   */
  actor?: 'journalist' | 'super-admin'
}

// Loads the article, then hands it to a form that is keyed by the article's id.
// The form's state is initialised once per article, so later refetches (e.g. a
// cover-image upload, which saves immediately) can never overwrite what is being typed.
const EditArticleView = ({ articleId, actor = 'journalist' }: EditArticleViewProps) => {
  const journalistReady = authStore((s) => s.bootstrapped)
  const adminReady = superAdminAuthStore((s) => s.bootstrapped)
  const bootstrapped = actor === 'super-admin' ? adminReady : journalistReady
  const { data: article, isLoading } = useArticle(articleId, bootstrapped)

  if (isLoading || !article) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6 sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return <EditArticleForm key={article.id} article={article} actor={actor} />
}

const EditArticleForm = ({ article, actor }: { article: ArticleDto; actor: 'journalist' | 'super-admin' }) => {
  const router = useRouter()
  const isAdmin = actor === 'super-admin'
  const articleId = article.id
  const updateArticle = useUpdateArticle(articleId)
  const deleteArticle = useDeleteArticle()
  const submitForReview = useSubmitArticleForReview(articleId)

  const [values, setValues] = useState<BilingualArticleValues>({
    titleId: article.titleId,
    titleEn: article.titleEn,
    excerptId: article.excerptId,
    excerptEn: article.excerptEn,
    contentId: article.contentId,
    contentEn: article.contentEn,
  })
  const [regionId, setRegionId] = useState<string | null>(article.regionId)
  const [reportUrl, setReportUrl] = useState(article.reportUrl || '')
  const [pressReleaseUrl, setPressReleaseUrl] = useState(article.pressReleaseUrl || '')
  const [visualUrl, setVisualUrl] = useState(article.visualUrl || '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const editable = isAdmin ? !article.deletedAt : article.status === 'DRAFT' || article.status === 'REJECTED'
  const backHref = isAdmin ? `/super-admin/articles/${articleId}` : '/dashboard'
  const incomplete = missingLanguages(article)

  const handleSave = async (): Promise<boolean> => {
    try {
      await updateArticle.mutateAsync({
        ...values,
        regionId,
        reportUrl: reportUrl || null,
        pressReleaseUrl: pressReleaseUrl || null,
        visualUrl: visualUrl || null,
      })
      return true
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save the article'))
      return false
    }
  }

  const handleSaveClick = async () => {
    if (await handleSave()) toast.success('Saved')
  }

  const handleSubmitForReview = async () => {
    if (!(await handleSave())) return
    try {
      await submitForReview.mutateAsync()
      toast.success('Submitted for review')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to submit the article'))
    }
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
            <Link href={backHref}>
              <ArrowLeft className="size-3.5" /> Back
            </Link>
          }
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
              {isAdmin ? 'Editing as super admin' : 'Editing'}
            </p>
            <h1 className="mt-1.5 font-tilt-warp text-4xl tracking-tight text-foreground">Edit Article</h1>
          </div>
          <ArticleStatusBadge status={article.status} />
        </div>
      </div>

      {article.status === 'REJECTED' && article.rejectionReason && (
        <Alert className="mt-6 border-[#F5D0CF] bg-[#FDEBEC] text-[#9F2F2D] [&_svg]:text-[#9F2F2D]">
          <Warning size={16} />
          <AlertTitle>
            {isAdmin ? 'Rejected' : 'Rejected — editing will resubmit for a fresh review.'}
          </AlertTitle>
          <AlertDescription className="text-[#9F2F2D]/80">{article.rejectionReason}</AlertDescription>
        </Alert>
      )}

      {isAdmin && article.status === 'PUBLISHED' && (
        <Alert className="mt-6 border-[#BFD9EE] bg-[#E1F3FE] text-[#1F6C9F] [&_svg]:text-[#1F6C9F]">
          <Info size={16} />
          <AlertTitle>This article is live</AlertTitle>
          <AlertDescription className="text-[#1F6C9F]/80">
            Changes you save appear on the public website immediately.
          </AlertDescription>
        </Alert>
      )}

      {incomplete.length > 0 && article.status !== 'DRAFT' && (
        <Alert className="mt-6 border-[#F3E4B5] bg-[#FBF3DB] text-[#956400] [&_svg]:text-[#956400]">
          <Warning size={16} />
          <AlertDescription className="text-[#956400]/80">
            The {incomplete.map((locale) => LOCALE_NAMES[locale]).join(' and ')} version is empty or incomplete.
            Readers of that language will see the other language until it is filled in.
          </AlertDescription>
        </Alert>
      )}

      <Card className="animate-in fade-in-0 slide-in-from-bottom-2 mt-8 duration-700">
        <CardContent className="flex flex-col gap-7">
          <BilingualArticleFields values={values} onChange={setValues} disabled={!editable} />

          <Separator />

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
        </CardContent>

        {editable && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
            {isAdmin ? (
              <span />
            ) : (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmOpen(true)}
                disabled={article.status !== 'DRAFT' || deleteArticle.isPending}
                className="text-[#9F2F2D] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
              >
                <Trash className="size-4" /> Delete draft
              </Button>
            )}

            <div className="flex gap-3">
              <Button
                variant={isAdmin ? 'default' : 'outline'}
                onClick={handleSaveClick}
                disabled={updateArticle.isPending}
              >
                {updateArticle.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              {!isAdmin && (
                <Button
                  onClick={handleSubmitForReview}
                  disabled={submitForReview.isPending || updateArticle.isPending}
                >
                  {submitForReview.isPending ? 'Submitting...' : 'Submit for Review'}
                </Button>
              )}
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
