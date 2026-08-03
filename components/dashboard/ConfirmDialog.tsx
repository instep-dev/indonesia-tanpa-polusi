'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  isPending?: boolean
  onConfirm: () => void
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Delete',
  isPending = false,
  onConfirm,
}: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          disabled={isPending}
          className="bg-[#9F2F2D] text-white hover:bg-[#9F2F2D]/90"
        >
          {isPending ? 'Deleting...' : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
)

export default ConfirmDialog
