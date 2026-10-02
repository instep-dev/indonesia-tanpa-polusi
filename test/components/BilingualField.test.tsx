/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom'
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BilingualField from '@/components/dashboard/BilingualField'
import type { BilingualValue } from '@/components/dashboard/BilingualField'

const mockMutateAsync = jest.fn()
let mockPending = false

jest.mock('@/services/translate/translate.queries', () => ({
  useTranslateTexts: () => ({ mutateAsync: mockMutateAsync, isPending: mockPending }),
}))

// The confirm dialog is a third-party modal; test our logic against a minimal stand-in.
jest.mock('@/components/dashboard/ConfirmDialog', () => ({
  __esModule: true,
  default: ({ open, title, onOpenChange, onConfirm }: { open: boolean; title: string; onOpenChange: (open: boolean) => void; onConfirm: () => void }) =>
    open ? (
      <div role="alertdialog">
        <p>{title}</p>
        <button onClick={() => onOpenChange(false)}>Cancel</button>
        <button onClick={onConfirm}>Confirm replace</button>
      </div>
    ) : null,
}))

const Harness = ({ initial, kind = 'text' }: { initial: BilingualValue; kind?: 'text' | 'textarea' | 'paragraphs' }) => {
  const [value, setValue] = useState(initial)
  return <BilingualField idPrefix="f" kind={kind} value={value} onChange={setValue} />
}

const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement | HTMLTextAreaElement

beforeEach(() => {
  mockMutateAsync.mockReset()
  mockPending = false
})

describe('BilingualField', () => {
  it('lets the admin type in both languages without any translation', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ id: '', en: '' }} />)

    await user.type(field(/Indonesian/), 'Halo dunia')
    await user.type(field(/English/), 'Hello world')

    expect(field(/Indonesian/).value).toBe('Halo dunia')
    expect(field(/English/).value).toBe('Hello world')
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })

  it('fills the empty English side from Indonesian without asking', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(['Hello world'])
    render(<Harness initial={{ id: 'Halo dunia', en: '' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from Indonesian/ }))

    expect(mockMutateAsync).toHaveBeenCalledWith({ from: 'id', texts: ['Halo dunia'] })
    await waitFor(() => expect(field(/English/).value).toBe('Hello world'))
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('translates the other way too (English → Indonesian)', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(['Halo dunia'])
    render(<Harness initial={{ id: '', en: 'Hello world' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from English/ }))

    expect(mockMutateAsync).toHaveBeenCalledWith({ from: 'en', texts: ['Hello world'] })
    await waitFor(() => expect(field(/Indonesian/).value).toBe('Halo dunia'))
  })

  it('asks before overwriting existing text, and keeps it when cancelled', async () => {
    const user = userEvent.setup()
    render(<Harness initial={{ id: 'Halo dunia', en: 'My own English' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from Indonesian/ }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Replace the English text?')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(field(/English/).value).toBe('My own English')
  })

  it('overwrites only after the admin confirms', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(['Hello world'])
    render(<Harness initial={{ id: 'Halo dunia', en: 'My own English' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from Indonesian/ }))
    await user.click(screen.getByRole('button', { name: 'Confirm replace' }))

    await waitFor(() => expect(field(/English/).value).toBe('Hello world'))
  })

  it('disables a Translate button while its source side is empty', () => {
    render(<Harness initial={{ id: 'Halo', en: '' }} />)
    expect(screen.getByRole('button', { name: /Translate from Indonesian/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Translate from English/ })).toBeDisabled()
  })

  it('leaves everything untouched when the translation fails', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockRejectedValue(new Error('503'))
    render(<Harness initial={{ id: 'Halo dunia', en: '' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from Indonesian/ }))

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled())
    expect(field(/English/).value).toBe('')
    expect(field(/Indonesian/).value).toBe('Halo dunia')
  })

  it('translates multi-paragraph text paragraph by paragraph and keeps the blank lines', async () => {
    const user = userEvent.setup()
    mockMutateAsync.mockResolvedValue(['One', 'Two'])
    render(<Harness kind="paragraphs" initial={{ id: 'Satu\n\nDua', en: '' }} />)

    await user.click(screen.getByRole('button', { name: /Translate from Indonesian/ }))

    expect(mockMutateAsync).toHaveBeenCalledWith({ from: 'id', texts: ['Satu', 'Dua'] })
    await waitFor(() => expect(field(/English/).value).toBe('One\n\nTwo'))
  })

  it('warns when both languages hold identical text', () => {
    render(<Harness initial={{ id: 'Aksi Tuntutan di Monas', en: 'Aksi Tuntutan di Monas' }} />)
    expect(screen.getByText(/same text/i)).toBeInTheDocument()
  })

  it('shows progress and blocks double-clicks while translating', () => {
    mockPending = true
    render(<Harness initial={{ id: 'Halo', en: '' }} />)
    const buttons = screen.getAllByRole('button', { name: /Translating/ })
    expect(buttons).toHaveLength(2)
    buttons.forEach((button) => expect(button).toBeDisabled())
  })
})
