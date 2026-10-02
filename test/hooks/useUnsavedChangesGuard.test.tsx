/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'

const addLink = (href: string, attrs: Record<string, string> = {}) => {
  const anchor = document.createElement('a')
  anchor.href = href
  for (const [key, value] of Object.entries(attrs)) anchor.setAttribute(key, value)
  document.body.appendChild(anchor)
  return anchor
}

// Click an anchor and report whether the guard cancelled it. A cancelled click
// never reaches the bubble phase (the guard stops propagation), so the probe
// only runs for clicks that were let through — it also swallows them, to stop
// jsdom attempting a real (unimplemented) navigation.
const clickAndCheckPrevented = (anchor: HTMLAnchorElement, init: MouseEventInit = {}): boolean => {
  let reachedBubble = false
  let prevented = false
  const probe = (event: Event) => {
    reachedBubble = true
    prevented = event.defaultPrevented
    event.preventDefault()
  }
  document.addEventListener('click', probe)
  anchor.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init }))
  document.removeEventListener('click', probe)
  return reachedBubble ? prevented : true
}

let confirmSpy: jest.SpyInstance

beforeEach(() => {
  confirmSpy = jest.spyOn(window, 'confirm')
  window.history.replaceState({}, '', '/super-admin/content/home')
})

afterEach(() => {
  confirmSpy.mockRestore()
  document.body.innerHTML = ''
})

describe('useUnsavedChangesGuard', () => {
  it('does nothing while disabled', () => {
    renderHook(() => useUnsavedChangesGuard(false))
    const prevented = clickAndCheckPrevented(addLink('/super-admin/journalists'))
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(prevented).toBe(false)
  })

  it('asks before an in-app link and cancels the navigation when declined', () => {
    confirmSpy.mockReturnValue(false)
    renderHook(() => useUnsavedChangesGuard(true))
    expect(clickAndCheckPrevented(addLink('/super-admin/journalists'))).toBe(true)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
  })

  it('lets the navigation continue when the user confirms', () => {
    confirmSpy.mockReturnValue(true)
    renderHook(() => useUnsavedChangesGuard(true))
    expect(clickAndCheckPrevented(addLink('/super-admin/journalists'))).toBe(false)
    expect(confirmSpy).toHaveBeenCalledTimes(1)
  })

  it('ignores same-page anchors, new-tab links, external links and modified clicks', () => {
    confirmSpy.mockReturnValue(false)
    renderHook(() => useUnsavedChangesGuard(true))

    expect(clickAndCheckPrevented(addLink('#section'))).toBe(false)
    expect(clickAndCheckPrevented(addLink('/super-admin/journalists', { target: '_blank' }))).toBe(false)
    expect(clickAndCheckPrevented(addLink('https://example.com/page'))).toBe(false)
    expect(clickAndCheckPrevented(addLink('/super-admin/journalists'), { ctrlKey: true })).toBe(false)
    expect(confirmSpy).not.toHaveBeenCalled()
  })

  it('blocks tab close / reload with beforeunload', () => {
    renderHook(() => useUnsavedChangesGuard(true))
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('stays on the page when Back is declined, and goes back when confirmed', () => {
    const back = jest.spyOn(window.history, 'back').mockImplementation(() => {})
    const push = jest.spyOn(window.history, 'pushState')

    renderHook(() => useUnsavedChangesGuard(true))
    expect(push).toHaveBeenCalledTimes(1) // sentinel entry

    confirmSpy.mockReturnValueOnce(false)
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(back).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledTimes(2) // sentinel restored

    confirmSpy.mockReturnValueOnce(true)
    window.dispatchEvent(new PopStateEvent('popstate'))
    expect(back).toHaveBeenCalledTimes(1)

    back.mockRestore()
    push.mockRestore()
  })

  it('removes its listeners when disabled again', () => {
    confirmSpy.mockReturnValue(false)
    const { rerender } = renderHook(({ on }) => useUnsavedChangesGuard(on), { initialProps: { on: true } })
    rerender({ on: false })
    expect(clickAndCheckPrevented(addLink('/super-admin/journalists'))).toBe(false)
    expect(confirmSpy).not.toHaveBeenCalled()
  })
})
