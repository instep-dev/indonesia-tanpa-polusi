import type { NextRequest } from 'next/server'
import { articleEvents } from '@/libs/sse'

const HEARTBEAT_MS = 25_000

// GET /api/articles/stream — SSE endpoint, open to anonymous connections
// (the public marketing site subscribes to this too). Emits a bare "changed"
// ping whenever any article is created/updated/submitted/reviewed — carries
// no article data, so no auth is required. The client re-fetches its own
// filtered/paginated list rather than the server pushing per-client data.
export const GET = async (request: NextRequest): Promise<Response> => {
  const encoder = new TextEncoder()
  let heartbeat: ReturnType<typeof setInterval>

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        try {
          controller.enqueue(encoder.encode('data: {"type":"ARTICLES_CHANGED"}\n\n'))
        } catch {
          // controller already closed
        }
      }

      articleEvents.on('changed', send)

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, HEARTBEAT_MS)

      request.signal.addEventListener('abort', () => {
        articleEvents.off('changed', send)
        clearInterval(heartbeat)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
