'use client'

import { usePathname } from 'next/navigation'

// Shown only while the super-admin is previewing unpublished changes — never to visitors.
const PreviewBanner = () => {
  const pathname = usePathname()
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] flex items-center justify-center gap-3 bg-brand-navy px-4 py-2.5 text-sm text-white shadow-lg">
      <span>Previewing unpublished changes — visitors can&apos;t see this.</span>
      {/* A plain link: it must reach the route handler, not the client router. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href={`/api/preview/exit?path=${encodeURIComponent(pathname)}`}
        className="rounded-full bg-brand-yellow px-3 py-1 text-xs font-semibold text-brand-navy"
      >
        Exit preview
      </a>
    </div>
  )
}

export default PreviewBanner
