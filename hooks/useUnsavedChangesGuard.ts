'use client'

import { useEffect } from 'react'

const DEFAULT_MESSAGE = 'You have unsaved changes. Leave this page and discard them?'
const SENTINEL_KEY = '__unsavedGuard'

// Warns before unsaved edits are thrown away. Next's App Router has no "route
// change start" event, so this covers the three ways a user can leave:
//  1. closing/reloading the tab        → `beforeunload`
//  2. clicking any in-app link          → capture-phase click listener (runs
//     before <Link> handles the click, and can cancel it)
//  3. browser Back                      → one sentinel history entry, so Back
//     lands on our own page first and we can ask before going further.
//
// Known, accepted limitation of (3): the sentinel entry stays in the history
// after the guard is switched off (e.g. after saving), so Back may need one
// extra press. Programmatic `router.push` is not intercepted.
export const useUnsavedChangesGuard = (enabled: boolean, message: string = DEFAULT_MESSAGE): void => {
  useEffect(() => {
    if (!enabled) return

    let leaving = false

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target
      const anchor = target instanceof Element ? target.closest('a[href]') : null
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return // a real page load → beforeunload
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return // #anchor

      if (!window.confirm(message)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }

    const pushSentinel = () => window.history.pushState({ ...window.history.state, [SENTINEL_KEY]: true }, '', window.location.href)

    const onPopState = (event: PopStateEvent) => {
      if (leaving) return
      // Back popped our sentinel: we are on our own page again. Keep Next's router out of it.
      event.stopImmediatePropagation()
      if (window.confirm(message)) {
        leaving = true
        window.history.back()
      } else {
        pushSentinel()
      }
    }

    if (!window.history.state?.[SENTINEL_KEY]) pushSentinel()

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', onPopState, true)

    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState, true)
    }
  }, [enabled, message])
}
