'use client'

import { Geist } from 'next/font/google'
import '../styles/globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

const GlobalError = ({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) => (
  <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
    <body className="min-h-full flex flex-col items-center justify-center bg-white text-gray-900">
      <div className="text-center space-y-4 px-6">
        <h1 className="text-4xl font-bold">500</h1>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        {error.digest && (
          <p className="text-sm text-gray-500">Error ID: {error.digest}</p>
        )}
        <button
          onClick={unstable_retry}
          className="mt-4 px-6 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </body>
  </html>
)

export default GlobalError
