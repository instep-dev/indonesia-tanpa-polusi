'use client'

import { useRef } from 'react'
import { toast } from 'vibe-toast'
import { UploadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useUploadImage } from '@/services/upload/upload.queries'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'

type SiteImageFieldProps = {
  /** Effective image URL (custom, or the default when none is set). Empty = no image. */
  value: string
  defaultValue: string
  onChange: (value: string) => void
}

// Image picker for CMS fields: shows what the site uses right now, uploads a
// replacement to R2 (`site/` folder) and can fall back to the built-in image.
const SiteImageField = ({ value, defaultValue, onChange }: SiteImageFieldProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useUploadImage('site')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`Image is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`)
      return
    }

    try {
      const { url } = await upload.mutateAsync(file)
      onChange(url)
    } catch {
      // Error toast is already shown by useUploadImage's onError.
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative flex aspect-video w-full max-w-56 items-center justify-center overflow-hidden rounded-lg border bg-neutral-400">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-white/80">No image</span>
        )}
      </div>

      <div className="flex min-w-0 flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upload.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadSimple /> {upload.isPending ? 'Uploading…' : 'Upload new image'}
          </Button>
          {value !== defaultValue && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(defaultValue)}>
              {defaultValue ? 'Use default' : 'Remove image'}
            </Button>
          )}
        </div>
        <p className="max-w-full truncate font-mono text-[11px] text-muted-foreground">
          {value || 'No image set'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

export default SiteImageField
