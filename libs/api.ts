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

// Attach access token (journalist OR super admin — whichever has a token)
http.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken ?? superAdminAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

// Silent refresh + race condition queue
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

const processQueue = (newToken: string) => {
  refreshQueue.forEach((cb) => cb(newToken))
  refreshQueue = []
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    // The refresh endpoints' own 401s are not "an expired access token" —
    // they mean there's no valid session at all (e.g. AuthProvider's bootstrap
    // probe on a logged-out visitor). Retrying them here would recursively
    // call refresh again and, on failure, force-redirect a user who may not
    // even be trying to be logged in. Let the caller (AuthProvider) handle it.
    if (error.response?.status !== 401 || original._retry || isRefreshCall) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(http(original))
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
