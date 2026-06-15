@AGENTS.md

# MCU Instep — Project Guide for Claude

## Project Overview

Fullstack Next.js 16 application (BFF — Backend for Frontend). Frontend and backend live in the same codebase. API routes at `/api/*` serve as the backend. PostgreSQL database via Prisma ORM. Multilingual (Indonesian + English).

**Runtime**: Node.js (not Edge). Next.js 16 defaults Proxy (formerly Middleware) to Node.js runtime.

---

## Tech Stack

| Category | Library | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.7 |
| Language | TypeScript | 5 |
| UI | React | 19.2.4 |
| Styling | TailwindCSS | v4 |
| Database | PostgreSQL | 16 (Docker) |
| ORM | Prisma + PrismaPg adapter | 7.8.0 |
| Server state | TanStack Query (React Query) | v5 |
| Client state | Zustand | v5 |
| Table | TanStack Table | v8 |
| HTTP client | Axios | v1 |
| Animation | Framer Motion + Lenis smooth scroll | v12 |
| Icons | Phosphor Icons | v2 |
| Charts | ApexCharts | v5 |
| Toast | Vibe Toast | v0.2 |
| UI components | Shadcn | v4 |

---

## Critical: Next.js 16 Breaking Changes

Before writing any code, read the relevant doc in `node_modules/next/dist/docs/`.

### Middleware → Proxy
`middleware.ts` is **deprecated and renamed to `proxy.ts`**. The exported function must be named `proxy`, not `middleware`.

```ts
// WRONG — old pattern
export function middleware(request: NextRequest) {}

// CORRECT — Next.js 16
export const proxy = (request: NextRequest): NextResponse | undefined => {}
```

The proxy file lives at the project root: `proxy.ts`.

### `unstable_retry` replaces `reset` in error boundaries
In `error.tsx` and `global-error.tsx`, the retry prop is `unstable_retry`, not `reset`.

---

## Coding Conventions

### Always use ES7+ arrow functions
Never use `function` keyword for component or utility declarations.

```ts
// WRONG
function MyComponent({ name }: { name: string }) { return <div>{name}</div> }
export default function Page() {}

// CORRECT
const MyComponent = ({ name }: { name: string }) => <div>{name}</div>
const Page = () => <div />
export default Page
```

For `export default` with arrow functions, declare then export:
```ts
const MyPage = () => <div />
export default MyPage
```

### Never import React for JSX
React 17+ JSX transform handles this automatically. Only import specific hooks/types.

```ts
// WRONG
import React from 'react'

// CORRECT — only import what you use
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
```

### TypeScript
- Always use `import type` for type-only imports
- Use `as const` for constant arrays/objects that need literal types
- Use `satisfies` operator to validate types without widening
- No `any` — use `unknown` and narrow properly
- Prefer type guards over type casting

---

## Environment Variables

`.env` — Docker Compose reads this automatically for `${VAR}` substitution.

Key variables:
```
DATABASE_URL        — Prisma connection string
NEXT_PUBLIC_API     — API base URL (http://localhost:3000/api)
NEXT_PUBLIC_API_PORT — Port number (3000)
POSTGRES_USER/PASSWORD/DB/PORT — Docker PostgreSQL
PGADMIN_EMAIL/PASSWORD — Docker pgAdmin
```

---

## Folder Structure

```
mcu-instep/
├── animations/          # Animation components (reusable or page-specific)
├── app/                 # Next.js App Router
├── components/          # React components (4 categories)
├── context/             # Global React context
├── data/                # Static data constants
├── hooks/               # Custom React hooks
├── i18n/                # Translation utilities
├── layouts/             # Layout wrapper components
├── libs/                # Pure TypeScript utility functions
├── messages/            # Translation JSON files
├── prisma/              # Prisma schema and migrations
├── providers/           # Global provider wrapper components
├── public/              # Static assets (images, fonts, etc.)
├── scripts/             # Utility scripts (.ts, .sql, .py)
├── services/            # API layer (Axios + React Query + Zustand)
├── styles/              # Global CSS and style utilities
├── proxy.ts             # Auth guard + locale detection (Next.js 16 Proxy)
├── prisma.config.ts     # Prisma configuration
└── compose.yml          # Docker: PostgreSQL + pgAdmin
```

---

## Folder Conventions

### `animations/`
Components that wrap or apply animations. Can be reusable or page-specific. Uses Framer Motion, Lenis, CSS animations, or Tailwind animation utilities.

Current: `SmoothScroll.tsx` — Lenis smooth scroll, initialized once at root layout level.

### `app/`
Next.js 16 App Router. File conventions:
- `layout.tsx` — layout wrapper
- `page.tsx` — page component
- `error.tsx` — error boundary (Client Component, uses `unstable_retry`)
- `loading.tsx` — loading UI
- `route.ts` — API route handler

Route structure:
```
app/
├── layout.tsx                    # Root layout (ThemeProvider, QueryProvider, fonts, global CSS)
├── page.tsx                      # Root → redirects to /en
├── global-error.tsx              # Catches errors in root layout (must have <html><body>)
├── (protected)/                  # Route group — tenant dashboard (URLs: /dashboard, /settings)
│   └── layout.tsx                → DashboardLayout (TenantProvider + AuthProvider)
├── (super-admin)/                # Route group — super admin panel (URLs: /super-admin/*)
│   ├── layout.tsx                → SuperAdminLayout (SuperAdminAuthProvider)
│   └── super-admin/              # URL prefix: /super-admin
│       └── dashboard/
│           └── page.tsx
├── [locale]/                     # Locale-based routes (en / id)
│   ├── layout.tsx                → LocaleLayout (loads i18n dictionary)
│   └── (marketing)/              # Route group — public marketing pages
│       └── (home)/
│           └── page.tsx
├── auth/                         # Tenant auth routes (bypassed by proxy)
│   ├── login/
│   └── logout/
├── super-admin/                  # Super admin auth routes (bypassed by proxy, no layout group)
│   └── auth/
│       ├── login/
│       └── logout/
└── api/                          # API route handlers (all bypassed by proxy)
    ├── auth/                     # Tenant auth endpoints
    │   ├── login/route.ts
    │   ├── refresh/route.ts
    │   └── logout/route.ts
    ├── super-admin/
    │   └── auth/                 # Super admin auth endpoints
    │       ├── login/route.ts
    │       ├── refresh/route.ts
    │       └── logout/route.ts
    └── [resource]/
        └── route.ts
```

**Important routing rules:**
- Tenant dashboard pages → `app/(protected)/` — URL has NO locale prefix (e.g., `/dashboard`)
- Super admin pages → `app/(super-admin)/super-admin/*` — URL HAS `/super-admin` prefix
- Super admin auth → `app/super-admin/auth/*` — outside the route group, bypassed by proxy, no layout
- Marketing/public pages → `app/[locale]/(marketing)/` — URL HAS locale prefix (e.g., `/en/about`)
- Tenant auth → `app/auth/*` — bypassed by proxy
- API routes → `app/api/*` — always bypassed by proxy

### `components/`
Split into 4 categories:

```
components/
├── reusable/     # Generic UI components usable anywhere (Button, Input, Modal, etc.)
├── marketing/    # Components used in marketing/public pages (Hero, Navbar, Footer, etc.)
├── dashboard/    # Components used in dashboard (Table, Sidebar, StatCard, etc.)
└── auth/         # Components used in auth pages (LoginForm, etc.)
```

### `context/`
Global React context created with `createContext` + `useContext`. Use for app-wide state that needs React's context mechanism (e.g., theme context, user context that needs to be consumed deep in the tree without Zustand).

**Difference from `providers/`:**
- `context/` = the actual context definition + hook (e.g., `ThemeContext.ts`, `useTheme.ts`)
- `providers/` = the wrapping component that provides the context (e.g., `ThemeProvider.tsx`)

### `data/`
Static data stored as typed arrays of objects. Format: `object[]` inside `data.ts` or named files.

```ts
// data/nav-links.ts
export const navLinks = [
  { label: 'Home', href: '/en' },
  { label: 'About', href: '/en/about' },
] satisfies { label: string; href: string }[]
```

### `hooks/`
Custom React hooks — must use at least one React primitive (`useState`, `useEffect`, `useRouter`, `useCallback`, etc.). Must be reusable (not page-specific logic).

```ts
"use client"
import { useRouter } from "next/navigation"  // Always next/navigation, NOT next/router

export const useMyHook = () => { ... }
```

**Always import from `next/navigation`** (App Router). `next/router` is Pages Router and will error.

### `i18n/`
Everything related to translations.

- `getDictionary.ts` — loads the correct JSON dictionary by locale, exports `Locale` type, `Dictionary` type, `getDictionary()` async function, `hasLocale()` type guard
- `getLang.ts` — converts a pathname from one locale to another

Supported locales: `en`, `id`. Default: `en`.

### `layouts/`
Layout wrapper components passed to `layout.tsx` files. Each represents a distinct section of the app.

```
layouts/
├── LocaleLayout.tsx       # Loads i18n dict, wraps marketing pages
├── MarketingLayout.tsx    # <main> wrapper for public pages
├── DashboardLayout.tsx    # Dashboard shell (sidebar, topbar, etc.)
└── SuperAdminLayout.tsx   # Super admin shell
```

### `libs/`
Pure TypeScript utility functions. **No React hooks or state.** No `useState`, `useEffect`, `useRouter`, etc. These are plain functions that can run on server or client.

Current files:
- `api.ts` — Axios instance + all interceptors (auth header, tenant slug, silent refresh, race condition queue)
- `db.ts` — Prisma client singleton + `dbForTenant` factory
- `getBaseApi.ts` — resolves API base URL from env vars
- `getInitials.ts` — extracts initials from a name string
- `getTrimText.ts` — trims text with ellipsis
- `withTenant.ts` — HOF to extract tenant slug and inject `tenantDb` into API route handlers
- `provisionTenant.ts` — creates PostgreSQL schema + tables for a new tenant
- `validateToken.ts` — validates opaque access token from Authorization header against DB

**`api.ts` is not just a base Axios setup — it must contain all interceptors.** The file currently at `libs/api.ts` only has the base config and needs to be updated once the stores exist. Full final content:

```ts
// libs/api.ts
import axios from 'axios'
import { authStore } from '@/services/auth/auth.store'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import { tenantStore } from '@/services/tenant/tenant.store'

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  withCredentials: true,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// 1. Attach access token (tenant user OR super admin — whichever has a token)
// 2. Attach tenant slug if present
http.interceptors.request.use((config) => {
  const token =
    authStore.getState().accessToken ??
    superAdminAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`

  const slug = tenantStore.getState().slug
  if (slug) config.headers['X-Tenant-Slug'] = slug

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
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)
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

    // Determine which auth system to refresh (super admin vs tenant)
    const isSuperAdmin = !!superAdminAuthStore.getState().accessToken
    const refreshUrl = isSuperAdmin
      ? `${process.env.NEXT_PUBLIC_API}/super-admin/auth/refresh`
      : `${process.env.NEXT_PUBLIC_API}/auth/refresh`

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
```

### `messages/`
Translation JSON files, one per locale.

```
messages/
├── en.json    # English
└── id.json    # Indonesian
```

Structure mirrors the app sections:
```json
{
  "marketing": {
    "home": {
      "hero": { "title": "Hello World" }
    }
  },
  "dashboard": { ... },
  "auth": { ... }
}
```

Always add new keys to ALL locale files simultaneously.

### `pages/`
Currently not in use. Skip — write marketing pages directly inside `app/[locale]/(marketing)/`.

### `prisma/`
Prisma schema and generated migrations.

```
prisma/
├── schema.prisma     # Data models
└── migrations/       # Auto-generated by prisma migrate dev
```

Prisma uses `@prisma/adapter-pg` (native PostgreSQL adapter). Config lives in `prisma.config.ts` at root.

Run migrations: `bunx prisma migrate dev --name <migration-name>`
Generate client: `bunx prisma generate`

### `providers/`
Wrapping components that provide context to their children. These are React components that wrap children with a Provider JSX element.

**Difference from `context/`:**
- `providers/` = the component that wraps children (e.g., `QueryProvider`, `ThemeProvider`)
- `context/` = the context/hook definition that consumers use

Current: `QueryProviders.tsx` — wraps app with `QueryClientProvider` from TanStack Query.

### `public/`
Static assets served at `/`. Images, SVGs, fonts, etc.

### `scripts/`
Utility scripts for dev/ops tasks. Can be `.ts`, `.sql`, or `.py`.

Examples: seed scripts, migration helpers, data import scripts.

### `services/`
**The core of the data layer.** One folder per API resource. Each folder has up to 5 files:

```
services/
└── [resource]/
    ├── [resource].api.ts      # Axios calls — grouped in an object
    ├── [resource].dto.ts      # TypeScript types for request/response
    ├── [resource].queries.ts  # TanStack Query hooks (useQuery, useMutation, simple SSE)
    ├── [resource].store.ts    # Zustand store — only when persistent client state needed
    └── [resource].sse.ts      # SSE — only when the stream is complex (reconnect, etc.)
```

**When to add each file:**

| File | Add when |
|---|---|
| `*.api.ts` | Always |
| `*.dto.ts` | Always |
| `*.queries.ts` | Always |
| `*.store.ts` | Only for persistent client state — e.g. auth tokens, user session |
| `*.sse.ts` | Only when SSE stream is complex (reconnect logic, multiple events) — simple SSE stays in `queries.ts` |

---

#### `*.dto.ts` — Types only

Use `type`, not `interface`. Nullable fields use `Type | null`, not optional `?` (unless the field is truly absent from the payload).

```ts
// project.dto.ts
export type ProjectDto = {
  id: string
  name: string
  status: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProjectBody = {
  name: string
}

export type UpdateProjectBody = {
  name?: string
  status?: string
}

// SSE event union type (if applicable)
export type ProjectSseEvent =
  | { type: 'PROJECT_UPDATED'; project: ProjectDto }
  | { type: 'PROJECT_DELETED'; id: string }
```

---

#### `*.api.ts` — Axios calls grouped in an object

All API calls for a resource are methods on a single exported object. Auth token is passed per-call as a parameter (not injected globally).

```ts
// project.api.ts
import { http } from '@/libs/api'
import type { ProjectDto, CreateProjectBody, UpdateProjectBody } from './project.dto'

export const projectApi = {
  getAll: async (): Promise<ProjectDto[]> => {
    const res = await http.get<ProjectDto[]>('/projects')
    return res.data
  },

  getOne: async (id: string): Promise<ProjectDto> => {
    const res = await http.get<ProjectDto>(`/projects/${id}`)
    return res.data
  },

  create: async (body: CreateProjectBody): Promise<ProjectDto> => {
    const res = await http.post<ProjectDto>('/projects', body)
    return res.data
  },

  update: async (id: string, body: UpdateProjectBody): Promise<ProjectDto> => {
    const res = await http.patch<ProjectDto>(`/projects/${id}`, body)
    return res.data
  },

  remove: async (id: string): Promise<void> => {
    await http.delete(`/projects/${id}`)
  },
}
```

If the endpoint requires an auth token explicitly (e.g. Bearer token from store):
```ts
getOne: async (accessToken: string, id: string): Promise<ProjectDto> => {
  const res = await http.get<ProjectDto>(`/projects/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.data
},
```

---

#### `*.queries.ts` — TanStack Query hooks

Always add `"use client"` at the top. Query keys are grouped in a `*Keys` const object. Simple SSE (no reconnect needed) can also live here as a `use*Stream` hook.

```ts
// project.queries.ts
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { projectApi } from './project.api'
import type { ProjectDto, ProjectSseEvent, UpdateProjectBody } from './project.dto'

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
}

export const useProjects = () =>
  useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectApi.getAll,
  })

export const useProject = (id: string) =>
  useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectApi.getOne(id),
    enabled: !!id,
  })

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  })
}

export const useUpdateProject = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateProjectBody) => projectApi.update(id, body),
    onSuccess: (data) => qc.setQueryData(projectKeys.detail(id), data),
  })
}

// Simple SSE — no reconnect needed, lives here in queries.ts
export const useProjectStream = (id: string, enabled = true) => {
  const qc = useQueryClient()
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!id || !enabled) return

    const controller = new AbortController()
    abortRef.current = controller

    ;(async () => {
      try {
        const res = await fetch(`/api/projects/${id}/stream`, {
          headers: { Accept: 'text/event-stream' },
          signal: controller.signal,
        })
        if (!res.ok || !res.body) return

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            try {
              const event: ProjectSseEvent = JSON.parse(line.slice(5).trim())
              if (event.type === 'PROJECT_UPDATED') {
                qc.setQueryData<ProjectDto>(projectKeys.detail(id), event.project)
              }
            } catch { /* malformed line — ignore */ }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    })()

    return () => controller.abort()
  }, [id, enabled, qc])
}
```

---

#### `*.store.ts` — Zustand (only when needed)

Use the curried form `create<State>()((set) => ...)`. Export as `resourceStore` (not `useResourceStore`) so it can be accessed outside React components via `resourceStore.getState()`.

```ts
// auth.store.ts
import { create } from 'zustand'
import type { UserDto } from './auth.dto'

type AuthState = {
  accessToken: string | null
  user: UserDto | null
  bootstrapped: boolean
  setAuth: (payload: { accessToken: string; user?: UserDto | null }) => void
  clear: () => void
  setBootstrapped: (v: boolean) => void
}

export const authStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,

  setAuth: ({ accessToken, user }) =>
    set((s) => ({ accessToken, user: user ?? s.user })),

  clear: () => set({ accessToken: null, user: null }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
```

Access outside React: `authStore.getState().accessToken`
Access inside React: `authStore((s) => s.user)`

---

#### `*.sse.ts` — Complex SSE (reconnect, multi-event, abort)

Use when the stream needs reconnect logic or is too complex for `queries.ts`.

**Why `fetch` instead of Axios for SSE:**
- Axios buffers the full response before resolving — it cannot read a stream line-by-line
- Native `EventSource` cannot send custom headers (e.g. `Authorization`)
- `fetch` + `response.body.getReader()` is the only way to consume SSE while sending auth headers

**Rule:** Axios (`http` from `@/libs/api`) is for all regular HTTP calls in `*.api.ts`. `fetch` is only used in SSE stream hooks (`*.sse.ts` and stream hooks inside `*.queries.ts`). Never use `fetch` for regular REST calls.

```ts
// project-activity.sse.ts
"use client"

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authStore } from '@/services/auth/auth.store'
import { projectKeys } from './project.queries'

export const useProjectActivitySse = (projectId: string) => {
  const qc = useQueryClient()
  const mountedRef = useRef(true)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true

    const connect = async () => {
      if (!mountedRef.current) return
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const token = authStore.getState().accessToken
        if (!token) return

        const res = await fetch(`/api/projects/${projectId}/activity/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        })
        if (!res.ok || !res.body) throw new Error('SSE failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (!mountedRef.current) { reader.cancel(); break }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            try {
              const data = JSON.parse(line.slice(5).trim()) as { type: string }
              if (data.type === 'ACTIVITY_CHANGED') {
                void qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
              }
            } catch { /* ignore */ }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!mountedRef.current) return
        reconnectRef.current = setTimeout(connect, 5_000)
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      abortRef.current?.abort()
    }
  }, [projectId, qc])
}
```

### `styles/`
- `globals.css` — TailwindCSS v4 `@import "tailwindcss"`, CSS variables (colors, fonts)
- `styles.ts` — reusable Tailwind class string constants

---

## Proxy (Auth Guard + Locale)

`proxy.ts` at project root runs on every request before routing.

**Current logic:**
1. `/api/*` → pass through (no processing)
2. `/auth/*` → pass through (no processing)
3. `/super-admin/auth/*` → pass through (no processing)
4. Protected tenant paths (`/dashboard`, `/settings`, etc.) → check `refresh_token` cookie existence → redirect to `/auth/login` if missing
5. Protected super-admin paths (`/super-admin`, etc.) → check `refresh_token` cookie existence → redirect to `/super-admin/auth/login` if missing
6. Everything else → check for locale prefix (`/en/`, `/id/`) → redirect to `/{detected-locale}{path}` if missing

**Why check `refresh_token` and not the access token:**
The access token lives in Zustand (memory) — it is never in a cookie, so proxy cannot read it. The proxy only checks for `refresh_token` cookie *existence* (not validity). Actual token validation (DB lookup + expiry check) happens inside each API route handler via `validateAccessToken`.

**When adding a new protected route**, add the path to `PROTECTED_PATHS` or `SUPER_ADMIN_PATHS` in `proxy.ts`:
```ts
const PROTECTED_PATHS = ['/dashboard', '/settings', '/profile', '/your-new-route']
const SUPER_ADMIN_PATHS = ['/super-admin']
```

The cookie name `refresh_token` must match exactly what `/api/auth/login` and `/api/auth/refresh` set.

---

## i18n Pattern

1. Dictionary loaded server-side in layout (`LocaleLayout.tsx`)
2. Passed as props to components that need it
3. `hasLocale(locale)` from `getDictionary.ts` used to validate locale and trigger 404 for unknown locales

```ts
// In a server component page
const Home = async ({ params }: { params: Promise<{ locale: string }> }) => {
  const { locale } = await params
  const validLocale: Locale = locale === 'en' ? 'en' : 'id'
  const dict = await getDictionary(validLocale)
  return <Hero dict={dict.marketing.home} />
}
```

---

## Database Pattern

Prisma client is a singleton in `libs/db.ts`. Import `db` directly:

```ts
import { db } from '@/libs/db'

const users = await db.user.findMany()
```

Use inside API route handlers (`app/api/*/route.ts`), never in Client Components.

---

## API Route Pattern

```ts
// app/api/projects/route.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from '@/libs/db'

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const projects = await db.project.findMany()
  return NextResponse.json(projects)
}

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const body = await request.json()
  const project = await db.project.create({ data: body })
  return NextResponse.json(project, { status: 201 })
}
```

---

## State Management Rules

| State type | Tool |
|---|---|
| Server/async data (API responses) | TanStack Query (`services/*.queries.ts`) |
| Auth user / session info | Zustand (`services/auth/auth.store.ts`) |
| Complex client UI state | Zustand (`services/*/[resource].store.ts`) |
| Simple local UI state | `useState` inside the component |
| Global app context (theme, etc.) | React Context (`context/`) + Provider (`providers/`) |

---

## Real-time Data Rule

**Never use polling.** Always use Server-Sent Events (SSE).

- SSE hook goes in `services/[resource]/[resource].sse.ts`
- SSE API endpoint goes in `app/api/[resource]/stream/route.ts`

---

## Docker

```bash
docker compose up -d        # Start PostgreSQL + pgAdmin
docker compose down -v      # Stop and remove volumes (fresh start)
```

- PostgreSQL: `localhost:5432`
- pgAdmin UI: `http://localhost:5050` (login with `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` from `.env`)
- pgAdmin server connection: host=`db`, port=`5432`, user=`POSTGRES_USER`, pass=`POSTGRES_PASSWORD`

Docker reads `.env` (not `.env.local`) for `${VAR}` substitution in `compose.yml`.

---

## Multi-Tenant Architecture

**Strategy: PostgreSQL schema-per-tenant.** One database, one `public` schema for global/shared data, one isolated schema per tenant. All tenant business data is completely isolated at the schema level.

### Schema Layout

| Schema | Contents |
|---|---|
| `public` | Global: `Tenant` table, `SuperAdmin` table, global migrations |
| `tenant_acme` | All data for tenant "acme": users, auth tokens, business tables |
| `tenant_globex` | Same structure, fully isolated from `tenant_acme` |

Tenant slug rules:
- Slug stored with hyphens in `public.Tenant` table: `acme-corp`
- Schema name converts hyphens → underscores: `tenant_acme_corp`
- Schema name must match: `/^[a-z][a-z0-9_]*$/`

```ts
const toSchemaName = (slug: string) => `tenant_${slug.replace(/-/g, '_')}`
```

---

### Prisma Per-Tenant Connection

`libs/db.ts` exports a `public`-schema singleton and a per-request factory for tenant schemas. The `@prisma/adapter-pg` `schema` option routes all queries to the correct schema.

```ts
// libs/db.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const createPrismaClient = (schema = 'public') =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, schema }),
  })

const globalForPrisma = globalThis as unknown as { db?: PrismaClient }
export const db = (globalForPrisma.db ??= createPrismaClient())

// New connection per request — not cached, not singleton
export const dbForTenant = (slug: string) =>
  createPrismaClient(`tenant_${slug.replace(/-/g, '_')}`)
```

---

### Tenant Resolution (proxy.ts)

The tenant slug comes from the `X-Tenant-Slug` request header. The proxy validates the format; route handlers trust the header is already clean.

```ts
// proxy.ts — add this before locale/auth logic
const SLUG_RE = /^[a-z][a-z0-9-]*$/

// Inside proxy():
const slug = request.headers.get('x-tenant-slug')
if (slug && !SLUG_RE.test(slug)) {
  return NextResponse.json({ error: 'Invalid tenant slug' }, { status: 400 })
}
```

On the client, the Axios instance reads the slug from `tenantStore` and sets the header on every outgoing request:

```ts
// libs/api.ts — request interceptor
http.interceptors.request.use((config) => {
  const slug = tenantStore.getState().slug
  if (slug) config.headers['X-Tenant-Slug'] = slug
  return config
})
```

---

### `withTenant` HOF (API Routes)

Wrap every tenant API route with `withTenant` instead of reading the header manually:

```ts
// libs/withTenant.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { PrismaClient } from '@prisma/client'
import { dbForTenant } from './db'

type TenantContext = { tenantDb: PrismaClient; slug: string }
type TenantHandler = (req: NextRequest, ctx: TenantContext) => Promise<NextResponse>

export const withTenant = (handler: TenantHandler) =>
  async (request: NextRequest): Promise<NextResponse> => {
    const slug = request.headers.get('x-tenant-slug')
    if (!slug) return NextResponse.json({ error: 'Tenant required' }, { status: 400 })

    const tenantDb = dbForTenant(slug)
    return handler(request, { tenantDb, slug })
  }
```

Usage:

```ts
// app/api/users/route.ts
import { withTenant } from '@/libs/withTenant'

export const GET = withTenant(async (_request, { tenantDb }) => {
  const users = await tenantDb.user.findMany()
  return NextResponse.json(users)
})
```

---

### Tenant Provisioning

When a new tenant is registered, create their schema and all tenant tables in a single provisioning call. Call this **after** inserting the `Tenant` row in `public`.

```ts
// libs/provisionTenant.ts
import { db } from './db'

export const provisionTenant = async (slug: string): Promise<void> => {
  const schema = `tenant_${slug.replace(/-/g, '_')}`

  await db.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`)

  // Repeat for each tenant table:
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}"."User" (
      id         TEXT        PRIMARY KEY,
      email      TEXT        NOT NULL UNIQUE,
      name       TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  // AccessToken, RefreshToken, and all business tables follow the same pattern
}
```

```ts
// app/api/tenants/route.ts
import { db } from '@/libs/db'
import { provisionTenant } from '@/libs/provisionTenant'

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  const { name, slug } = await request.json()
  const tenant = await db.tenant.create({ data: { name, slug } })
  await provisionTenant(slug)
  return NextResponse.json(tenant, { status: 201 })
}
```

---

### Cross-Tenant Aggregation (Super Admin)

Query `public.Tenant` to get all slugs, then run parallel queries across schemas:

```ts
const tenants = await db.tenant.findMany({ select: { slug: true } })
const counts = await Promise.all(
  tenants.map(({ slug }) => dbForTenant(slug).user.count())
)
```

---

### Super Admin Auth

Super admins are a completely separate system from tenant users:
- Stored in `public."SuperAdmin"` — not in any tenant schema
- Use the same Opaque Token mechanism with their own token tables in `public` (`AccessToken`, `RefreshToken` mirrored in public schema)
- Can query any tenant schema via `dbForTenant(slug)`
- Routes live under `app/(super-admin)/` — a separate route group from `(protected)/`
- Super admin API routes use `db` (public schema) instead of `withTenant`

**DTO** (`services/super-admin/super-admin-auth.dto.ts`):

```ts
export type SuperAdminDto = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export type SuperAdminLoginBody = {
  email: string
  password: string
}
```

**Store** (`services/super-admin/super-admin-auth.store.ts`):

Mirrors `authStore` exactly but scoped to super admin. Kept separate so super admin session and tenant session never mix.

```ts
// services/super-admin/super-admin-auth.store.ts
import { create } from 'zustand'
import type { SuperAdminDto } from './super-admin-auth.dto'

type SuperAdminAuthState = {
  accessToken: string | null
  superAdmin: SuperAdminDto | null
  bootstrapped: boolean
  setAuth: (payload: { accessToken: string; superAdmin: SuperAdminDto }) => void
  setAccessToken: (token: string) => void
  clear: () => void
  setBootstrapped: (v: boolean) => void
}

export const superAdminAuthStore = create<SuperAdminAuthState>()((set) => ({
  accessToken: null,
  superAdmin: null,
  bootstrapped: false,
  setAuth: ({ accessToken, superAdmin }) => set({ accessToken, superAdmin }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, superAdmin: null }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
```

Access outside React: `superAdminAuthStore.getState().accessToken`
Access inside React: `superAdminAuthStore((s) => s.superAdmin)`

The Axios interceptor in `libs/api.ts` needs to pick the right store based on context. Since super admin routes never have a tenant slug, the tenant interceptor will be a no-op for them. For the auth header, both stores use the same `accessToken` field — the interceptor reads from whichever store has a non-null token:

```ts
// libs/api.ts — auth header interceptor (handles both tenant + super admin)
http.interceptors.request.use((config) => {
  const token =
    authStore.getState().accessToken ??
    superAdminAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

---

### Tenant Store (`services/tenant/tenant.store.ts`)

Zustand store that holds the active tenant slug. The Axios interceptor reads from here to attach `X-Tenant-Slug` on every request.

```ts
// services/tenant/tenant.store.ts
import { create } from 'zustand'

type TenantState = {
  slug: string | null
  setSlug: (slug: string) => void
  clear: () => void
}

export const tenantStore = create<TenantState>()((set) => ({
  slug: null,
  setSlug: (slug) => set({ slug }),
  clear: () => set({ slug: null }),
}))
```

Access outside React: `tenantStore.getState().slug`
Access inside React: `tenantStore((s) => s.slug)`

---

### Frontend: Subdomain Tenant Detection

The tenant slug is extracted **server-side** from the `host` header in the layout, then passed as a prop to `TenantProvider`. This avoids any client-side delay before the Axios interceptor has the slug.

```ts
// layouts/DashboardLayout.tsx (server component)
import { headers } from 'next/headers'
import TenantProvider from '@/providers/TenantProvider'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  // acme.app.com → 'acme' | acme.localhost:3000 → 'acme'
  const slug = host.split('.')[0]

  return <TenantProvider slug={slug}>{children}</TenantProvider>
}

export default DashboardLayout
```

---

### `TenantProvider` (`providers/TenantProvider.tsx`)

Client component that writes the slug into `tenantStore` synchronously — before children render — so the Axios interceptor has the slug on the very first request.

```ts
// providers/TenantProvider.tsx
'use client'

import type { ReactNode } from 'react'
import { tenantStore } from '@/services/tenant/tenant.store'

const TenantProvider = ({ slug, children }: { slug: string; children: ReactNode }) => {
  // Set synchronously (not in useEffect) so the slug is available
  // before the first Axios request fires from any child component
  tenantStore.setState({ slug })

  return <>{children}</>
}

export default TenantProvider
```

The Axios interceptor in `libs/api.ts` reads from `tenantStore`:

```ts
// libs/api.ts — request interceptor
import { tenantStore } from '@/services/tenant/tenant.store'

http.interceptors.request.use((config) => {
  const slug = tenantStore.getState().slug
  if (slug) config.headers['X-Tenant-Slug'] = slug
  return config
})

---

## Opaque Token Auth

This app uses **Opaque Tokens**, not JWT. Tokens are random hex strings — they contain no claims, cannot be decoded, and must be looked up in the database on every request. This enables instant revocation.

### Token Generation

```ts
import crypto from 'crypto'

const generateToken = () => crypto.randomBytes(32).toString('hex')
// Produces a 64-character lowercase hex string
```

### Hashing for DB Storage

Tokens are **never stored in plain text**. Always hash with SHA-256 before writing to the DB:

```ts
const hashToken = (raw: string) =>
  crypto.createHash('sha256').update(raw).digest('hex')
```

The raw token is returned to the client once. The hash is what lives in the DB.

---

### Token Properties

| | Access Token | Refresh Token |
|---|---|---|
| TTL | 30 minutes | 30 days |
| Client storage | Zustand (memory) | httpOnly cookie |
| DB storage | `sha256(token)` in `AccessToken` table | `sha256(token)` in `RefreshToken` table |
| Sent on requests | `Authorization: Bearer <raw>` header | Automatic via cookie (`withCredentials`) |
| Rotates | On every refresh | On every refresh (both rotate together) |

---

### Prisma Token Models

Add to every tenant schema (and to `public` for super admin tokens):

```prisma
model AccessToken {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model RefreshToken {
  id           String    @id @default(cuid())
  tokenHash    String    @unique
  userId       String
  replacedById String?   @unique
  revokedAt    DateTime?
  expiresAt    DateTime
  createdAt    DateTime  @default(now())
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### Refresh Token Cookie Config

Set this cookie in both `/api/auth/login` and `/api/auth/refresh` responses:

```ts
response.cookies.set('refresh_token', rawRefreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  path: '/api/auth/refresh',  // Cookie only sent to the refresh endpoint
})
```

**SameSite:**
- `lax` in development — allows cookie to be sent in localhost subdomain scenarios (`acme.localhost`)
- `strict` in production — cookie only sent on same-site requests, prevents CSRF

---

### Full Token Lifecycle

```
LOGIN
  1. Verify credentials
  2. rawAccess  = generateToken()   rawRefresh = generateToken()
  3. DB: insert sha256(rawAccess)  in AccessToken  (expiresAt: now + 30 min)
  4. DB: insert sha256(rawRefresh) in RefreshToken (expiresAt: now + 30 days)
  5. Set httpOnly cookie: rawRefresh
  6. Return: { accessToken: rawAccess, user }

CLIENT (on login response)
  → authStore.setAuth({ accessToken: rawAccess, user })
  → Axios interceptor attaches it to every request: Authorization: Bearer <rawAccess>

API REQUEST VALIDATION
  → Extract raw token from Authorization header
  → sha256(raw) → look up in DB.AccessToken
  → Check expiresAt > now
  → Valid: proceed | Expired/missing: return 401

REFRESH (triggered by 401)
  → POST /api/auth/refresh (cookie sent automatically)
  → Read rawRefresh from cookie → sha256 → look up in DB.RefreshToken
  → Check not revoked, expiresAt > now
  → Generate new rawAccess + new rawRefresh (both rotate)
  → Delete old AccessToken + old RefreshToken from DB
  → Insert new hashes in DB
  → Set new httpOnly cookie: new rawRefresh
  → Return: { accessToken: newRawAccess }
  → Axios interceptor: authStore.setAccessToken(newRawAccess) silently

LOGOUT
  → DELETE /api/auth/logout
  → DB: delete AccessToken where userId = current user (+ tenant)
  → DB: delete RefreshToken where userId = current user (+ tenant)
  → Clear httpOnly cookie (maxAge: 0)
  → Client: authStore.clear()
```

---

### Auth Store

```ts
// services/auth/auth.store.ts
import { create } from 'zustand'
import type { UserDto } from './auth.dto'

type AuthState = {
  accessToken: string | null
  user: UserDto | null
  bootstrapped: boolean
  setAuth: (payload: { accessToken: string; user: UserDto }) => void
  setAccessToken: (token: string) => void
  clear: () => void
  setBootstrapped: (v: boolean) => void
}

export const authStore = create<AuthState>()((set) => ({
  accessToken: null,
  user: null,
  bootstrapped: false,
  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null, user: null }),
  setBootstrapped: (v) => set({ bootstrapped: v }),
}))
```

`setAccessToken` exists separately from `setAuth` because silent refresh updates the token without touching `user`.

---

### Axios Interceptors: Silent Refresh + Race Condition Queue

```ts
// libs/api.ts
import axios from 'axios'
import { authStore } from '@/services/auth/auth.store'

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API,
  withCredentials: true, // sends httpOnly refresh_token cookie automatically
  timeout: 10_000,
})

// Attach access token on every outgoing request
http.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken
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
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error)
    original._retry = true

    if (isRefreshing) {
      // Queue this request — it will retry once the ongoing refresh completes
      return new Promise((resolve) => {
        refreshQueue.push((token: string) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(http(original))
        })
      })
    }

    isRefreshing = true

    try {
      // Cookie is sent automatically via withCredentials
      const { data } = await axios.post<{ accessToken: string }>(
        `${process.env.NEXT_PUBLIC_API}/auth/refresh`,
        {},
        { withCredentials: true },
      )

      authStore.getState().setAccessToken(data.accessToken)
      processQueue(data.accessToken)

      original.headers.Authorization = `Bearer ${data.accessToken}`
      return http(original)
    } catch {
      authStore.getState().clear()
      if (typeof window !== 'undefined') window.location.href = '/auth/login'
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)
```

**How the queue prevents race conditions:**
1. Requests A, B, C all get 401 simultaneously
2. A sets `isRefreshing = true`, starts refresh
3. B and C see `isRefreshing = true`, add their retry callbacks to `refreshQueue`
4. Refresh completes → `processQueue(newToken)` fires B's and C's callbacks with the new token
5. B and C retry with the new token — only one refresh ever hits the server

---

### App Bootstrap (Auth Provider)

On first load, attempt a silent refresh using the existing cookie to restore session without requiring login.

**`AuthProvider` does NOT go in root `app/layout.tsx`** — it goes in the protected/dashboard layout only. Marketing pages and auth pages must not trigger a bootstrap call.

```ts
// providers/AuthProvider.tsx
'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { authStore } from '@/services/auth/auth.store'
import type { UserDto } from '@/services/auth/auth.dto'

type BootstrapResponse = { accessToken: string; user: UserDto }

const AuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await http.post<BootstrapResponse>('/auth/refresh')
        authStore.getState().setAuth({ accessToken: data.accessToken, user: data.user })
      } catch {
        authStore.getState().clear()
      } finally {
        authStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default AuthProvider
```

Place it in the dashboard layout, wrapping children after `TenantProvider`:

```ts
// layouts/DashboardLayout.tsx
import TenantProvider from '@/providers/TenantProvider'
import AuthProvider from '@/providers/AuthProvider'

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  // ... slug extraction from host header

  return (
    <TenantProvider slug={slug}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TenantProvider>
  )
}
```

Super admin has its own separate bootstrap that calls a different endpoint:

```ts
// providers/SuperAdminAuthProvider.tsx
'use client'

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { http } from '@/libs/api'
import { superAdminAuthStore } from '@/services/super-admin/super-admin-auth.store'
import type { SuperAdminDto } from '@/services/super-admin/super-admin-auth.dto'

type BootstrapResponse = { accessToken: string; superAdmin: SuperAdminDto }

const SuperAdminAuthProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await http.post<BootstrapResponse>('/super-admin/auth/refresh')
        superAdminAuthStore.getState().setAuth({ accessToken: data.accessToken, superAdmin: data.superAdmin })
      } catch {
        superAdminAuthStore.getState().clear()
      } finally {
        superAdminAuthStore.getState().setBootstrapped(true)
      }
    }

    bootstrap()
  }, [])

  return <>{children}</>
}

export default SuperAdminAuthProvider
```

Place this in `layouts/SuperAdminLayout.tsx` instead of `AuthProvider`.

Gate any protected UI on `bootstrapped === true` to avoid flash of unauthenticated content.

---

### Token Validation Helper (API Routes)

```ts
// libs/validateToken.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'
import type { PrismaClient } from '@prisma/client'

type ValidResult = { ok: true; userId: string }
type InvalidResult = { ok: false; response: NextResponse }

export const validateAccessToken = async (
  request: NextRequest,
  tenantDb: PrismaClient,
): Promise<ValidResult | InvalidResult> => {
  const raw = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!raw) return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
  const token = await tenantDb.accessToken.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  })

  if (!token || token.expiresAt < new Date()) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { ok: true, userId: token.userId }
}
```

Combine `withTenant` + `validateAccessToken` in protected routes:

```ts
// app/api/users/route.ts
import { withTenant } from '@/libs/withTenant'
import { validateAccessToken } from '@/libs/validateToken'

export const GET = withTenant(async (request, { tenantDb }) => {
  const auth = await validateAccessToken(request, tenantDb)
  if (!auth.ok) return auth.response

  const users = await tenantDb.user.findMany({ where: { id: auth.userId } })
  return NextResponse.json(users)
})
