import axios from 'axios'
import { getBaseApiUrl } from './getBaseApi'
import { authStore } from '@/services/auth/auth.store'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'

export const http = axios.create({
  baseURL: getBaseApiUrl(),
  withCredentials: true,
  // Generous margin for the submit-for-review flow, which now runs real
  // translation work (LibreTranslate) server-side before responding, plus
  // Turbopack's on-demand route compile time in dev on a route's first hit.
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token (journalist OR super admin — whichever has a token).
// On /super-admin pages the super admin token takes priority, so a journalist
// session in the same browser can't shadow it (e.g. CMS uploads).
http.interceptors.request.use((config) => {
  const onSuperAdminPage =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/super-admin')
  const token = onSuperAdminPage
    ? (superAdminAuthStore.getState().accessToken ?? authStore.getState().accessToken)
    : (authStore.getState().accessToken ?? superAdminAuthStore.getState().accessToken)
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

// Silent refresh + race condition queue
let isRefreshing = false
type QueuedRetry = { onRefreshed: (token: string) => void; onFailed: (reason: unknown) => void }
let refreshQueue: QueuedRetry[] = []

const processQueue = (newToken: string) => {
  refreshQueue.forEach(({ onRefreshed }) => onRefreshed(newToken))
  refreshQueue = []
}

// A failed refresh must settle the waiting requests too, otherwise they hang forever.
const failQueue = (reason: unknown) => {
  refreshQueue.forEach(({ onFailed }) => onFailed(reason))
  refreshQueue = []
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    // No request config means a non-HTTP failure (e.g. the request was never built) — nothing to retry.
    if (!original) return Promise.reject(error)
    // login / register / refresh, for journalists and super admins alike.
    const isAuthCall = /\/auth\/(login|register|refresh)(\?|$)/.test(original.url ?? '')

    // These endpoints' own 401s are not "an expired access token":
    //  - refresh: there is no valid session at all (e.g. AuthProvider's bootstrap
    //    probe on a logged-out visitor). Retrying would recursively call refresh
    //    again and, on failure, force-redirect a user who may not even be trying
    //    to be logged in.
    //  - login: a wrong password. Treating it as an expired session would run a
    //    refresh that cannot succeed and then redirect to the (journalist) login
    //    page, so the "Invalid email or password" message never showed.
    // Let the caller handle them.
    if (error.response?.status !== 401 || original._retry || isAuthCall) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          onRefreshed: (token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(http(original))
          },
          onFailed: reject,
        })
      })
    }

    isRefreshing = true

    // Determine which auth system to refresh (super admin vs journalist)
    const isSuperAdmin = !!superAdminAuthStore.getState().accessToken
    const refreshUrl = isSuperAdmin
      ? `${getBaseApiUrl()}/super-admin/auth/refresh`
      : `${getBaseApiUrl()}/auth/refresh`

    try {
      const { data } = await axios.post<{ accessToken: string }>(
        refreshUrl,
        {},
        { withCredentials: true },
      )

      if (isSuperAdmin) {
        superAdminAuthStore.getState().setAccessToken(data.accessToken)
      } else {
        authStore.getState().setAccessToken(data.accessToken)
      }

      processQueue(data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return http(original)
    } catch {
      failQueue(error)
      if (isSuperAdmin) {
        superAdminAuthStore.getState().clear()
        if (typeof window !== 'undefined') window.location.href = '/super-admin/auth/login'
      } else {
        authStore.getState().clear()
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
      }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
