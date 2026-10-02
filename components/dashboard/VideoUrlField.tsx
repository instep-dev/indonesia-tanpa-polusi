'use client'

import { useState } from 'react'
import { CheckCircle, WarningCircle, CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { validateValue } from '@/libs/contentValidation'

type VideoUrlFieldProps = {
  /** Effective video URL (custom, or the default when none is set). */
  value: string
  defaultValue: string
  onChange: (value: string) => void
}

type PreviewStatus = 'checking' | 'playable' | 'failed'

const STATUS_STYLES: Record<PreviewStatus, string> = {
  checking: 'bg-muted text-muted-foreground',
  playable: 'bg-[#EDF3EC] text-[#346538]',
  failed: 'bg-[#FDEBEC] text-[#9F2F2D]',
}

// The super-admin can replace the home hero video with their own https URL.
// The preview loads the URL in a real <video> element, so "Playable" means this
// browser decoded it — the same check the public hero depends on.
const VideoUrlField = ({ value, defaultValue, onChange }: VideoUrlFieldProps) => {
  const isCustom = value !== defaultValue
  const [text, setText] = useState(isCustom ? value : '')
  const [previewUrl, setPreviewUrl] = useState(value)
  const [status, setStatus] = useState<PreviewStatus>('checking')

  const error = validateValue('video', text.trim())

  const commit = () => {
    const next = text.trim()
    if (error) return
    onChange(next || defaultValue)
    const effective = next || defaultValue
    if (effective !== previewUrl) {
      setStatus('checking')
      setPreviewUrl(effective)
    }
  }

  const useDefault = () => {
    setText('')
    onChange(defaultValue)
    if (previewUrl !== defaultValue) {
      setStatus('checking')
      setPreviewUrl(defaultValue)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="url"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            }
          }}
          placeholder={`Default: ${defaultValue} — or paste your own https:// video URL`}
          aria-invalid={error ? true : undefined}
          className="h-9 flex-1"
        />
        <Button type="button" variant="outline" size="lg" onClick={commit} disabled={!!error}>
          Preview
        </Button>
        {isCustom && (
          <Button type="button" variant="ghost" size="lg" onClick={useDefault}>
            Use default
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-[#9F2F2D]">{error}</p>}

      <div className="mx-auto w-full max-w-xl overflow-hidden rounded-lg border bg-neutral-900">
        <video
          key={previewUrl}
          src={previewUrl}
          controls
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setStatus('playable')}
          onCanPlay={() => setStatus('playable')}
          onError={() => setStatus('failed')}
          className="mx-auto block aspect-video w-full bg-neutral-900"
        />
      </div>

      <div
        role="status"
        className={`mx-auto flex w-fit max-w-xl items-center justify-center gap-1.5 rounded-md px-2.5 py-1 text-center text-xs ${STATUS_STYLES[status]}`}
      >
        {status === 'checking' && <CircleNotch className="size-3.5 animate-spin" />}
        {status === 'playable' && <CheckCircle className="size-3.5" weight="fill" />}
        {status === 'failed' && <WarningCircle className="size-3.5" weight="fill" />}
        {status === 'checking' && 'Checking the video…'}
        {status === 'playable' && (isCustom ? 'This video plays correctly.' : 'Default video plays correctly.')}
        {status === 'failed' &&
          'This video can’t be played. Use a direct https:// link to an .mp4 or .webm file that the host allows to be streamed.'}
      </div>
    </div>
  )
}

export default VideoUrlField
