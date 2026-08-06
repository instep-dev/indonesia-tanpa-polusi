'use client'

import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'vibe-toast'
import { X, Plus } from '@phosphor-icons/react'
import { useUploadImage } from '@/services/upload/upload.queries'
import { articleApi } from '@/services/article/article.api'
import { articleKeys } from '@/services/article/article.queries'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'
import type { ArticleImageDto } from '@/services/article/article.dto'

type ArticleGalleryProps = {
  articleId: string
  images: ArticleImageDto[]
  editable: boolean
}

const ArticleGallery = ({ articleId, images, editable }: ArticleGalleryProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage()
  const qc = useQueryClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`Image is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`)
      return
    }

    const { url } = await uploadImage.mutateAsync(file).catch(() => ({ url: null }))
    if (!url) return // Error toast is already shown by useUploadImage's onError.

    try {
      await articleApi.addImage(articleId, { url, order: images.length })
      qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
    } catch {
      toast.error('Image uploaded but failed to attach it to the article. Please try again.')
    }
  }

  const handleRemove = async (imageId: string) => {
    await articleApi.removeImage(articleId, imageId)
    qc.invalidateQueries({ queryKey: articleKeys.detail(articleId) })
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="relative aspect-square overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={image.caption ?? ''} className="h-full w-full object-cover" />
            {editable && (
              <button
                type="button"
                onClick={() => handleRemove(image.id)}
                aria-label="Remove image"
                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}

        {editable && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadImage.isPending}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <Plus size={20} />
            <span className="text-xs">{uploadImage.isPending ? 'Uploading...' : 'Add photo'}</span>
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

export default ArticleGallery
