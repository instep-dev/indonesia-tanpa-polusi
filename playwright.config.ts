import { defineConfig, devices } from '@playwright/test'
import { assertLocalDatabase } from './e2e/guard'

// e2e tests mutate content → they only ever run against a LOCAL database.
assertLocalDatabase(process.env.DATABASE_URL)

const port = Number(process.env.E2E_PORT ?? 3555)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // One shared database + one dev server: keep tests serial and deterministic.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: './e2e/.results',
  // Same snapshot name for every run, so a baseline taken from one build can be
  // compared with another (e.g. the original site vs. the CMS-backed site).
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled' } },
  use: { baseURL, trace: 'retain-on-failure' },
  // Uses the Google Chrome already installed on the machine (`channel: 'chrome'`)
  // instead of downloading Playwright's own ~570MB browser bundle.
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          ...(process.env as Record<string, string>),
          // Mock translator (e2e/mock-translate.ts) instead of a LibreTranslate container.
          TRANSLATE_API_URL: process.env.E2E_TRANSLATE_URL ?? 'http://127.0.0.1:5599/translate',
        },
      },
})
