'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { authStore } from '@/services/auth/auth.store'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { getBaseApiUrl } from '@/libs/getBaseApi'
import { articleKeys } from './article.queries'

// Shared connect loop — SSE carries no article data, just a "changed" ping,
// so the only thing that differs between the dashboard and public variants
// is which query keys get invalidated and whether an auth header is sent.
const connectArticlesStream = (
  qc: QueryClient,
  mountedRef: { current: boolean },
  reconnectRef: { current: ReturnType<typeof setTimeout> | null },
  abortRef: { current: AbortController | null },
  getAuthHeader: () => Record<string, string> | null,
  onChanged: () => void,
): void => {
  const connect = async () => {
    if (!mountedRef.current) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const authHeader = getAuthHeader()
      if (authHeader === null) {
        reconnectRef.current = setTimeout(connect, 3_000)
        return
      }

      const res = await fetch(`${getBaseApiUrl()}/articles/stream`, {
        headers: { ...authHeader, Accept: 'text/event-stream' },
        signal: controller.signal,
      })
      if (!res.ok || !res.body) throw new Error('SSE failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!mountedRef.current) {
          reader.cancel()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          try {
            const event = JSON.parse(line.slice(5).trim()) as { type: string }
            if (event.type === 'ARTICLES_CHANGED') onChanged()
          } catch {
            // ignore malformed line
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (!mountedRef.current) return
      reconnectRef.current = setTimeout(connect, 5_000)
    }
  }

  connect()
}

// Public — anonymous, no auth header. Used by the marketing site's Latest
// News list so it stays live for visitors who aren't logged in at all.
export const usePublicArticlesStream = (enabled: boolean): void => {
  const qc = useQueryClient()
  const mountedRef = useRef(true)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) return
    mountedRef.current = true

    connectArticlesStream(
      qc,
      mountedRef,
      reconnectRef,
      abortRef,
      () => ({}),
      () => void qc.invalidateQueries({ queryKey: articleKeys.publishedRoot() }),
    )

    return () => {
      mountedRef.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      abortRef.current?.abort()
    }
  }, [enabled, qc])
}

// Live-updates the articles list (My Articles / Review Queue) whenever any
// article is created/updated/submitted/reviewed by anyone — the server only
// pushes a bare "changed" ping, the client re-fetches its own filtered view.
export const useArticlesStream = (enabled: boolean): void => {
  const qc = useQueryClient()
  const mountedRef = useRef(true)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled) return
    mountedRef.current = true

    connectArticlesStream(
      qc,
      mountedRef,
      reconnectRef,
      abortRef,
      () => {
        const token = authStore.getState().accessToken ?? superAdminAuthStore.getState().accessToken
        return token ? { Authorization: `Bearer ${token}` } : null
      },
      () => void qc.invalidateQueries({ queryKey: articleKeys.all }),
    )

    return () => {
      mountedRef.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      abortRef.current?.abort()
    }
  }, [enabled, qc])
}
