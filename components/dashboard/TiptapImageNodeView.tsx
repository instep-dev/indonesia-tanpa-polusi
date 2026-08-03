'use client'

import { NodeViewWrapper } from '@tiptap/react'
import type { ReactNodeViewProps } from '@tiptap/react'
import { X } from '@phosphor-icons/react'

const TiptapImageNodeView = ({ node, deleteNode, selected }: ReactNodeViewProps) => (
  <NodeViewWrapper className="group relative my-2 inline-block max-w-full" data-drag-handle>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={node.attrs.src as string}
      alt={(node.attrs.alt as string) ?? ''}
      className={`max-w-full rounded-lg border ${selected ? 'ring-2 ring-[#1F6C9F]' : ''}`}
    />
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        deleteNode()
      }}
      aria-label="Remove image"
      className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80"
    >
      <X size={16} />
    </button>
  </NodeViewWrapper>
)

export default TiptapImageNodeView
