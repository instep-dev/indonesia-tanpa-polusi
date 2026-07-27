'use client'

import { Toaster } from 'vibe-toast'

// vibe-toast ships no "use client" directive in its build output, so it must
// be rendered from inside a client boundary we own — importing it straight
// into a Server Component crashes SSR/prerendering.
const ToastProvider = () => <Toaster position="top-right" />

export default ToastProvider
