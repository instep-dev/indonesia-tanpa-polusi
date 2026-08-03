import { EventEmitter } from 'events'

// Module-level singleton (like libs/db.ts) so all API route invocations in
// this server process share the same emitter — required for SSE routes to
// receive events triggered by other routes (e.g. article mutations).
const globalForSse = globalThis as unknown as { articleEvents?: EventEmitter }

export const articleEvents = globalForSse.articleEvents ?? new EventEmitter()
articleEvents.setMaxListeners(0)

if (process.env.NODE_ENV !== 'production') globalForSse.articleEvents = articleEvents

export const broadcastArticlesChanged = (): void => {
  articleEvents.emit('changed')
}
