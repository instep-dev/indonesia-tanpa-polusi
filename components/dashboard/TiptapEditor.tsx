'use client'

import { useEditor, EditorContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'vibe-toast'
import {
  TextB,
  TextItalic,
  ListBullets,
  ListNumbers,
  TextHOne,
  TextHTwo,
  ImageSquare,
  LinkSimple,
  Quotes,
} from '@phosphor-icons/react'
import { useUploadImage } from '@/services/upload/upload.queries'
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/libs/uploadLimits'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TiptapImageNodeView from '@/components/dashboard/TiptapImageNodeView'

const ALLOWED_LINK_PROTOCOLS = ['http:', 'https:', 'mailto:']

// Adds a hover "remove" button on inline images — the base Image extension
// has no delete affordance beyond selecting the node and pressing Backspace,
// which isn't discoverable for non-technical journalists.
const RemovableImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TiptapImageNodeView)
  },
})

type TiptapEditorProps = {
  content: unknown
  onChange: (content: unknown) => void
  placeholder?: string
}

const ToolbarButton = ({
  onClick,
  active,
  children,
  label,
}: {
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  label: string
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`rounded-md p-2 transition-colors ${active ? 'bg-[#E1F3FE] text-[#1F6C9F]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
  >
    {children}
  </button>
)

const TiptapEditor = ({ content, onChange, placeholder }: TiptapEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadImage = useUploadImage()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ['http', 'https', 'mailto'] },
      }),
      RemovableImage,
      Placeholder.configure({ placeholder: placeholder ?? 'Tulis isi artikel di sini...' }),
    ],
    content: content && Object.keys(content as object).length > 0 ? (content as object) : '',
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
    editorProps: {
      attributes: {
        class:
        'prose prose-neutral max-w-none focus:outline-none min-h-[300px] px-4 py-3 [&_h2]:text-2xl [&_h2]:tracking-tight [&_h3]:text-xl [&_h3]:tracking-tight',
      },
    },
  })

  // useEditor only applies `content` on mount. When the article loads
  // asynchronously (edit page), this prop changes after the editor already
  // mounted empty — sync it in so the loaded content actually appears.
  //
  // The setTimeout is required, not stylistic: content containing an image
  // mounts a React NodeView (TiptapImageNodeView), and ReactNodeViewRenderer
  // uses flushSync internally. Calling setContent synchronously inside this
  // effect fires that flushSync while React is still committing this very
  // effect, which React 18+ forbids ("flushSync was called from inside a
  // lifecycle method"). Deferring to a macrotask runs it after React is done.
  useEffect(() => {
    if (!editor) return
    const next = content && Object.keys(content as object).length > 0 ? (content as object) : ''
    const isSame = JSON.stringify(editor.getJSON()) === JSON.stringify(next)
    if (!isSame) {
      const timeoutId = setTimeout(() => {
        editor.commands.setContent(next, { emitUpdate: false })
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [content, editor])

  const handleImagePick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !editor) return

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error(`Image is too large. Maximum size is ${MAX_UPLOAD_SIZE_MB}MB.`)
      return
    }

    try {
      const { url } = await uploadImage.mutateAsync(file)
      editor.chain().focus().setImage({ src: url }).run()
    } catch {
      // Error toast is already shown by useUploadImage's onError.
    }
  }

  const openLinkDialog = () => {
    setLinkUrl(editor?.getAttributes('link').href ?? '')
    setLinkError(null)
    setLinkDialogOpen(true)
  }

  const handleInsertLink = () => {
    if (!editor) return

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setLinkDialogOpen(false)
      return
    }

    let parsed: URL
    try {
      parsed = new URL(linkUrl, window.location.origin)
    } catch {
      setLinkError('Invalid URL.')
      return
    }
    if (!ALLOWED_LINK_PROTOCOLS.includes(parsed.protocol)) {
      setLinkError('Only http, https, or mailto links are allowed.')
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: parsed.toString() }).run()
    setLinkDialogOpen(false)
  }

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/10 bg-black/75 p-2">
        <ToolbarButton
          label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
        >
          <TextB size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
        >
          <TextItalic size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
        >
          <TextHOne size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
        >
          <TextHTwo size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
        >
          <ListBullets size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
        >
          <ListNumbers size={18} />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
        >
          <Quotes size={18} />
        </ToolbarButton>
        <ToolbarButton label="Link" onClick={openLinkDialog} active={editor.isActive('link')}>
          <LinkSimple size={18} />
        </ToolbarButton>
        <ToolbarButton label="Insert image" onClick={handleImagePick}>
          <ImageSquare size={18} />
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploadImage.isPending && (
          <span className="ml-2 text-xs text-white/50">Uploading...</span>
        )}
      </div>

      <EditorContent editor={editor} />

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Insert link</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value)
                setLinkError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInsertLink()
                }
              }}
              placeholder="https://..."
              autoFocus
            />
            {linkError && <p className="text-xs text-[#9F2F2D]">{linkError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink}>{linkUrl.trim() ? 'Insert' : 'Remove link'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TiptapEditor
