'use client'

import { useRef } from 'react'
import { toast } from 'vibe-toast'
import { X, ImageSquare } from '@phosphor-icons/react'
import { useUploadImage } from '@/services/upload/upload.queries'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'
import type { UploadFolder } from '@/services/upload/upload.dto'

type CoverImageUploaderProps = {
  value: string | null
  onChange: (url: string | null) => void
  folder?: UploadFolder
  label?: string
  className?: string
}

const CoverImageUploader = ({
  value,
  onChange,
  folder = 'articles',
  label = 'Upload cover image',
  className = 'aspect-video w-full max-w-md',
}: CoverImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage(folder)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`Image is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`)
      return
    }

    try {
      const { url } = await uploadImage.mutateAsync(file)
      onChange(url)
    } catch {
      // Error toast is already shown by useUploadImage's onError.
    }
  }

  if (value) {
    return (
      <div className={`relative overflow-hidden rounded-xl border ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt={label} className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove image"
          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-colors hover:bg-black/80"
        >
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadImage.isPending}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${className}`}
      >
        <ImageSquare size={28} />
        <span className="text-sm">{uploadImage.isPending ? 'Uploading...' : label}</span>
      </button>
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

export default CoverImageUploader
