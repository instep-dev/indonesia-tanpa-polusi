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
├── layout.tsx                    # Root layout (QueryProvider, fonts, global CSS)
├── page.tsx                      # Root → redirects to /en
├── global-error.tsx              # Catches errors in root layout (must have <html><body>)
├── (protected)/                  # Route group — dashboard/admin routes (no locale prefix)
│   └── layout.tsx                → DashboardLayout
├── [locale]/                     # Locale-based routes (en / id)
│   ├── layout.tsx                → LocaleLayout (loads i18n dictionary)
│   └── (marketing)/              # Route group — public marketing pages
│       └── (home)/
│           └── page.tsx
├── auth/                         # Auth routes (no locale, no guard)
│   ├── login/
│   └── logout/
└── api/                          # API route handlers
    └── [resource]/
        └── route.ts
```

**Important routing rules:**
- Protected pages live under `app/(protected)/` — URL has NO locale prefix (e.g., `/dashboard`)
- Marketing/public pages live under `app/[locale]/(marketing)/` — URL HAS locale prefix (e.g., `/en/about`)
- API routes at `app/api/*` — bypassed by proxy, no auth or locale processing
- Auth routes at `app/auth/*` — bypassed by proxy

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

Current:
- `api.ts` — Axios instance with base URL, credentials, timeout
- `db.ts` — Prisma client singleton (uses `globalThis` for dev hot-reload safety)
- `getBaseApi.ts` — resolves API base URL from env vars
- `getInitials.ts` — extracts initials from a name string
- `getTrimText.ts` — trims text with ellipsis

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
3. Protected paths (`/dashboard`, `/settings`, etc.) → check `session` cookie → redirect to `/auth/login` if missing
4. Everything else → check for locale prefix (`/en/`, `/id/`) → redirect to `/{detected-locale}{path}` if missing

**When adding a new protected route**, add the path to `PROTECTED_PATHS` in `proxy.ts`:
```ts
const PROTECTED_PATHS = ['/dashboard', '/settings', '/profile', '/admin', '/your-new-route']
```

The cookie name `session` must match what the auth login handler sets.

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
