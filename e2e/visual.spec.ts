import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { ARTICLE_BOTH, ARTICLE_ID_ONLY } from './fixtures'

// Public-site screenshot suite. Run once against the ORIGINAL site to take the
// baseline (`--update-snapshots`), then against the CMS-backed site: with empty
// CMS tables the two must be pixel-identical.

const PAGES = [
  '/en',
  '/id',
  '/en/sulawesi',
  '/id/sulawesi',
  '/en/maluku-utara',
  '/id/maluku-utara',
  '/en/kalimantan-utara',
  '/id/kalimantan-utara',
  '/en/news',
  '/id/news',
  `/en/news/${ARTICLE_BOTH}`,
  `/id/news/${ARTICLE_BOTH}`,
  `/en/news/${ARTICLE_ID_ONLY}`,
  `/id/news/${ARTICLE_ID_ONLY}`,
]

// Lazy images only load when scrolled into view, so walk the page first.
const settle = async (page: Page) => {
  await page.addStyleTag({
    content: 'video { visibility: hidden !important } *, *::before, *::after { scroll-behavior: auto !important }',
  })
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = img.onerror = () => r(null) }))),
    ),
  )
  await page.waitForTimeout(1200)
}

for (const path of PAGES) {
  test(`public page ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'load' })
    await settle(page)
    const name = `${path.replace(/^\//, '').replace(/\//g, '_')}.png`
    await expect(page).toHaveScreenshot(name, { fullPage: true })
  })
}
