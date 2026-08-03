'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ArticleContentPreview from '@/components/dashboard/ArticleContentPreview'
import type { ArticleDto, SourceLocale } from '@/services/article/article.dto'

type ArticlePreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: ArticleDto
}

const ArticlePreviewDialog = ({ open, onOpenChange, article }: ArticlePreviewDialogProps) => {
  const [locale, setLocale] = useState<SourceLocale>(article.sourceLocale)

  const title = locale === 'id' ? article.titleId : article.titleEn
  const excerpt = locale === 'id' ? article.excerptId : article.excerptEn
  const content = locale === 'id' ? article.contentId : article.contentEn

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <DialogTitle className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Preview
          </DialogTitle>
          <div className="mr-6 flex gap-1 rounded-lg border bg-muted/40 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={locale === 'id' ? 'default' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setLocale('id')}
            >
              ID
            </Button>
            <Button
              type="button"
              size="sm"
              variant={locale === 'en' ? 'default' : 'ghost'}
              className="h-7 px-2.5 text-xs"
              onClick={() => setLocale('en')}
            >
              EN
            </Button>
          </div>
        </DialogHeader>

        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt="Cover"
            className="aspect-video w-full rounded-xl border object-cover"
          />
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title || '—'}
          </h1>
          {excerpt && <p className="mt-3 text-base text-muted-foreground italic">{excerpt}</p>}
        </div>

        <div className="border-t pt-6">
          <ArticleContentPreview content={content} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ArticlePreviewDialog
