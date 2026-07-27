'use client'

const ErrorPage = ({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
    <h1 className="text-4xl font-bold">Something went wrong</h1>
    {error.digest && <p className="text-sm text-foreground/50">Error ID: {error.digest}</p>}
    <button
      onClick={unstable_retry}
      className="mt-4 rounded-lg bg-foreground px-6 py-2 text-sm text-background transition-colors hover:opacity-90"
    >
      Try again
    </button>
  </div>
)

export default ErrorPage
