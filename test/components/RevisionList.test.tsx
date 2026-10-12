/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RevisionList from '@/components/dashboard/RevisionList'
import type { ContentRevisionDto } from '@/services/content-revision/content-revision.dto'

const mockMutateAsync = jest.fn()
let mockPending = false

jest.mock('@/services/content-revision/content-revision.queries', () => ({
  useRestoreRevision: () => ({ mutateAsync: mockMutateAsync, isPending: mockPending }),
}))
jest.mock('vibe-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { toast } = require('vibe-toast') as { toast: { success: jest.Mock; error: jest.Mock } }
jest.mock('@/components/dashboard/ConfirmDialog', () => ({
  __esModule: true,
  default: ({ open, description, onOpenChange, onConfirm }: { open: boolean; description: string; onOpenChange: (open: boolean) => void; onConfirm: () => void }) =>
    open ? (
      <div role="alertdialog">
        <p>{description}</p>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
        <button onClick={onConfirm}>Confirm restore</button>
      </div>
    ) : null,
}))

const rev = (id: string, valueId: string, valueEn: string, at: string, overrides: Partial<ContentRevisionDto> = {}): ContentRevisionDto => ({
  id,
  kind: 'field',
  targetKey: 'marketing.home.hero.title',
  collection: null,
  status: 'PUBLISHED',
  action: 'SAVE',
  snapshot: { valueId, valueEn },
  createdByName: 'Dewi Admin',
  createdAt: at,
  ...overrides,
})

// newest first, like the API returns them
const revisions = [
  rev('r3', 'Judul baru', 'New title', '2026-10-02T11:00:00.000Z'),
  rev('r2', 'Judul lama', 'Old title', '2026-10-01T11:00:00.000Z'),
  rev('r1', 'Judul pertama', 'First title', '2026-09-30T11:00:00.000Z'),
]

beforeEach(() => {
  mockMutateAsync.mockReset()
  mockMutateAsync.mockResolvedValue(undefined)
  toast.success.mockClear()
  toast.error.mockClear()
  mockPending = false
})

describe('RevisionList', () => {
  it('shows an empty state', () => {
    render(<RevisionList revisions={[]} />)
    expect(screen.getByText(/No changes recorded yet/)).toBeInTheDocument()
  })

  it('marks the newest version as current and offers Restore only on older ones', () => {
    render(<RevisionList revisions={revisions} />)

    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Restore this version/ })).toHaveLength(2)
    expect(screen.getAllByText(/Dewi Admin/)).toHaveLength(3)
  })

  it('shows what changed as added / removed words', () => {
    const { container } = render(<RevisionList revisions={revisions} showDiff />)

    // r3 vs r2: "lama"→"baru" and "Old"→"New"
    expect(container.querySelectorAll('ins')).not.toHaveLength(0)
    expect(Array.from(container.querySelectorAll('ins')).map((el) => el.textContent?.trim())).toEqual(expect.arrayContaining(['baru', 'New']))
    expect(Array.from(container.querySelectorAll('del')).map((el) => el.textContent?.trim())).toEqual(expect.arrayContaining(['lama', 'Old']))
  })

  it('labels each entry when a describer is given', () => {
    render(<RevisionList revisions={revisions.slice(0, 1)} describe={() => 'Hero title'} />)
    expect(screen.getByText('Hero title')).toBeInTheDocument()
  })

  it('restores only after confirmation, and can be cancelled', async () => {
    const user = userEvent.setup()
    render(<RevisionList revisions={revisions} />)

    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockMutateAsync).not.toHaveBeenCalled()

    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    await user.click(screen.getByRole('button', { name: 'Confirm restore' }))
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith('r2'))
  })

  it('confirms with a message and closes after a successful restore', async () => {
    const user = userEvent.setup()
    const onRestored = jest.fn()
    render(<RevisionList revisions={revisions} onRestored={onRestored} />)

    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    await user.click(screen.getByRole('button', { name: 'Confirm restore' }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Restored — the public site is updated'))
    expect(onRestored).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('still reports success when the list is gone by the time the restore finishes (the page re-mounts on restore)', async () => {
    const user = userEvent.setup()
    let finish: () => void = () => {}
    mockMutateAsync.mockReturnValue(new Promise<void>((resolve) => { finish = resolve }))
    const { unmount } = render(<RevisionList revisions={revisions} />)

    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    await user.click(screen.getByRole('button', { name: 'Confirm restore' }))
    unmount() // the editor around the list is re-mounted while the request is in flight
    finish()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Restored — the public site is updated'))
  })

  it('shows an error and keeps the dialog flow usable when the restore fails', async () => {
    const user = userEvent.setup()
    const onRestored = jest.fn()
    mockMutateAsync.mockRejectedValue(new Error('boom'))
    render(<RevisionList revisions={revisions} onRestored={onRestored} />)

    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    await user.click(screen.getByRole('button', { name: 'Confirm restore' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(toast.success).not.toHaveBeenCalled()
    expect(onRestored).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('warns that unsaved edits are lost only when the page has some', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<RevisionList revisions={revisions} pageDirty />)
    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    expect(screen.getByRole('alertdialog')).toHaveTextContent(/unsaved changes/i)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    rerender(<RevisionList revisions={revisions} />)
    await user.click(screen.getAllByRole('button', { name: /Restore this version/ })[0])
    expect(screen.getByRole('alertdialog')).not.toHaveTextContent(/unsaved changes/i)
  })

  it('does not offer Restore for list re-orderings', () => {
    const reorder = rev('o2', '', '', '2026-10-01T11:00:00.000Z', { kind: 'collection', targetKey: 'stories.home', action: 'REORDER', snapshot: { ids: ['a'] } })
    const newer = rev('o3', '', '', '2026-10-02T11:00:00.000Z', { kind: 'collection', targetKey: 'stories.home', action: 'REORDER', snapshot: { ids: ['b', 'a'] } })
    render(<RevisionList revisions={[newer, reorder]} />)
    expect(screen.queryByRole('button', { name: /Restore this version/ })).toBeNull()
  })
})
