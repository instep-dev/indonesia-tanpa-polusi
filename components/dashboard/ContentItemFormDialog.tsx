'use client'

import { useState } from 'react'
import type { CollectionDef } from '@/data/content-registry'
import type { ItemData } from '@/services/content-item/content-item.dto'
import CoverImageUploader from '@/components/dashboard/CoverImageUploader'
import BilingualField from '@/components/dashboard/BilingualField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ContentItemFormDialogProps = {
  collection: CollectionDef
  /** The item being edited, or null when creating a new one. */
  initial: ItemData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onSubmit: (data: ItemData) => void
}

const emptyData = (collection: CollectionDef): ItemData =>
  Object.fromEntries(
    collection.itemFields.map((field) => [field.name, field.localized ? { id: '', en: '' } : '']),
  )

type ItemFormProps = Omit<ContentItemFormDialogProps, 'open' | 'onOpenChange'> & { onCancel: () => void }

const ItemForm = ({ collection, initial, isPending, onSubmit, onCancel }: ItemFormProps) => {
  const [data, setData] = useState<ItemData>(() => ({ ...emptyData(collection), ...initial }))

  const setValue = (name: string, value: ItemData[string]) => setData((current) => ({ ...current, [name]: value }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(data)
      }}
      className="space-y-5"
    >
      {collection.itemFields.map((field) => {
        const value = data[field.name]
        const inputId = `item-${field.name}`

        if (field.type === 'image') {
          return (
            <div key={field.name} className="space-y-1.5">
              <Label>{field.label}</Label>
              <CoverImageUploader
                folder="site"
                label="Upload photo"
                className="aspect-square w-full max-w-48"
                value={typeof value === 'string' && value ? value : null}
                onChange={(url) => setValue(field.name, url ?? '')}
              />
              <p className="text-xs text-muted-foreground">Optional — leave empty to use the default photo.</p>
            </div>
          )
        }

        if (field.type === 'select') {
          const current = typeof value === 'string' ? value : ''
          const options = field.options ?? []
          return (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={inputId}>{field.label}</Label>
              <Select value={current} onValueChange={(next) => setValue(field.name, next ?? '')}>
                <SelectTrigger id={inputId} className="h-9 w-full sm:w-64">
                  <SelectValue placeholder="Instagram (default)">
                    {(selected: string | null) => options.find((option) => option.value === selected)?.label ?? 'Instagram (default)'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        if (field.localized && typeof value === 'object') {
          return (
            <div key={field.name} className="space-y-1.5">
              <Label htmlFor={`${inputId}-id`}>{field.label}</Label>
              <BilingualField
                idPrefix={inputId}
                kind={field.type === 'textarea' ? 'textarea' : 'text'}
                rows={5}
                value={value}
                onChange={(next) => setValue(field.name, next)}
              />
            </div>
          )
        }

        return (
          <div key={field.name} className="space-y-1.5">
            <Label htmlFor={inputId}>{field.label}</Label>
            <Input
              id={inputId}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValue(field.name, e.target.value)}
            />
          </div>
        )
      })}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  )
}

const ContentItemFormDialog = ({ open, onOpenChange, ...formProps }: ContentItemFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{formProps.initial ? 'Edit item' : 'Add item'}</DialogTitle>
        <DialogDescription>{formProps.collection.title}</DialogDescription>
      </DialogHeader>
      {/* Mounted per open, so the form always starts from the item being edited. */}
      {open && <ItemForm {...formProps} onCancel={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
)

export default ContentItemFormDialog
