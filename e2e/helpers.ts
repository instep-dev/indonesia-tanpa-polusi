import { expect } from '@playwright/test'
import type { APIRequestContext, Browser, Page } from '@playwright/test'
import { E2E_JOURNALIST, E2E_SUPER_ADMIN } from './fixtures'

// Shared by the CMS specs. Everything here talks to the LOCAL throwaway database only
// (playwright.config.ts refuses to start otherwise).

export const HERO_TITLE_KEY = 'marketing.home.hero.title'

/** A bilingual field's input, e.g. `field-marketing.home.hero.title-en` (the id contains dots, so use an attribute selector). */
export const fieldInput = (page: Page, key: string, locale: 'id' | 'en') => page.locator(`[id="field-${key}-${locale}"]`)

/** The whole editor row (label, input, History button…) around a field's input. */
export const fieldRow = (page: Page, key: string) =>
  fieldInput(page, key, 'en').locator('xpath=ancestor::div[contains(@class,"py-5")][1]')

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

export const apiLoginAdmin = async (request: APIRequestContext): Promise<string> => {
  const res = await request.post('/api/super-admin/auth/login', { data: E2E_SUPER_ADMIN })
  expect(res.status(), 'super admin API login').toBe(200)
  return (await res.json()).accessToken as string
}

export const apiLoginJournalist = async (request: APIRequestContext, creds = E2E_JOURNALIST): Promise<string> => {
  const res = await request.post('/api/auth/login', { data: creds })
  expect(res.status(), 'journalist API login').toBe(200)
  return (await res.json()).accessToken as string
}

/** Opens `path` as an anonymous visitor (no cookies, so no admin preview mode) and runs `check`. */
export const asVisitor = async <T>(browser: Browser, path: string, check: (page: Page) => Promise<T>): Promise<T> => {
  const context = await browser.newContext()
  try {
    const page = await context.newPage()
    await page.goto(path, { waitUntil: 'load' })
    return await check(page)
  } finally {
    await context.close()
  }
}

/** A unique suffix per run so repeated runs never collide on titles/emails. */
export const RUN_ID = Date.now().toString(36)
