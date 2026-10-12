import { expect as baseExpect, test } from '@playwright/test'
import type { APIRequestContext, BrowserContext, Page } from '@playwright/test'
import { ARTICLE_BOTH, E2E_SUPER_ADMIN } from './fixtures'
import { HERO_TITLE_KEY, RUN_ID, apiLoginAdmin, apiLoginJournalist, asVisitor, bearer, fieldInput, fieldRow } from './helpers'

// The super-admin CMS, driven in a real browser against the LOCAL throwaway database.
// One signed-in page is shared by all tests (the refresh cookie rotates on every page
// load, so a saved storage state could not be reused), and the tests run in order:
// each one builds on the state the previous one left.

// `configure` returns a NEW expect (it does not change the global one), so use this one.
const expect = baseExpect.configure({ timeout: 20_000 })
test.describe.configure({ mode: 'serial' })
test.setTimeout(120_000)

let context: BrowserContext
let page: Page

const TITLE_1 = `E2E first title ${RUN_ID}`
const TITLE_2 = `E2E second title ${RUN_ID}`
const STORY_NAME = `E2E Story ${RUN_ID}`
const STORY_QUOTE = `Kutipan uji e2e ${RUN_ID}` // a list row is titled by its quote; the name is its second line
const toast = (text: string | RegExp) => page.getByText(text).first()
const publicHeading = (visitorPage: Page) => visitorPage.locator('h1').first().innerText()

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext()
  page = await context.newPage()
})
test.afterAll(async () => {
  await context.close()
})

test.describe('sign in', () => {
  test('visiting the CMS signed out redirects to the login page', async () => {
    await page.goto('/super-admin/content')
    await expect(page).toHaveURL(/\/super-admin\/auth\/login/)
  })

  test('a wrong password is refused and keeps you on the login page', async () => {
    await page.fill('#email', E2E_SUPER_ADMIN.email)
    await page.fill('#password', 'definitely-not-the-password')
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/super-admin/auth/login')),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ])
    expect(response.status()).toBe(401) // really answered by our API, not just "some error"
    await expect(toast('Invalid email or password')).toBeVisible()
    await expect(page).toHaveURL(/\/super-admin\/auth\/login/)
  })

  test('the right password signs in to the dashboard', async () => {
    await page.fill('#password', E2E_SUPER_ADMIN.password)
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/super-admin/auth/login')),
      page.getByRole('button', { name: 'Sign in' }).click(),
    ])
    expect(response.status()).toBe(200)
    await expect(page).toHaveURL(/\/super-admin\/dashboard/)
    await expect(page.getByRole('heading', { name: 'All Articles' })).toBeVisible()
  })

  test('typing /super-admin while signed in opens the dashboard, not the public front page', async () => {
    await page.goto('/super-admin')
    await expect(page).toHaveURL(/\/super-admin\/dashboard/)
    await expect(page.getByRole('heading', { name: 'All Articles' })).toBeVisible()
  })

  test('the content index links to every editable page', async () => {
    await page.goto('/super-admin/content')
    await expect(page.getByRole('heading', { name: 'Content', exact: true })).toBeVisible()
    for (const slug of ['home', 'news', 'site', 'seo', 'sulawesi', 'maluku-utara', 'kalimantan-utara']) {
      await expect(page.locator(`a[href="/super-admin/content/${slug}"]`)).toBeVisible()
    }
  })

  test('an unknown content page says so', async () => {
    await page.goto('/super-admin/content/no-such-page')
    await expect(page.getByText('This content page does not exist.')).toBeVisible()
  })
})

test.describe('editing a text field: draft → preview → publish → history', () => {
  test('typing marks the field unsaved; saving a draft keeps it off the public site', async () => {
    await page.goto('/super-admin/content/home')
    await expect(page.getByText('Everything is published')).toBeVisible()

    await fieldInput(page, HERO_TITLE_KEY, 'en').fill(TITLE_1)
    await expect(page.getByText('1 unsaved change')).toBeVisible()

    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(toast(/Draft saved/)).toBeVisible()
    await expect(page.getByText('1 draft change not published yet')).toBeVisible()
    await expect(page.getByText('Draft — not published')).toBeVisible()
  })

  test('visitors still see the old title while it is only a draft', async ({ browser }) => {
    const heading = await asVisitor(browser, '/en', publicHeading)
    expect(heading).not.toContain(TITLE_1)
  })

  test('Preview EN opens the public page with the draft applied, and says it is a preview', async () => {
    const popupPromise = context.waitForEvent('page')
    await page.getByRole('button', { name: 'Preview EN' }).click()
    const popup = await popupPromise
    // The popup starts blank, is pointed at the one-time preview link, which redirects to /en.
    await expect.poll(() => popup.url(), { timeout: 60_000, message: 'popup URL' }).toMatch(/\/en$/)
    await popup.waitForLoadState('domcontentloaded')

    await expect(popup.locator('h1').first()).toContainText(TITLE_1)
    await expect(popup.getByText(/Previewing unpublished changes/)).toBeVisible()
    await popup.close()
  })

  test('the preview link can only be used once', async ({ browser, request }) => {
    // Ask for a fresh link through the API as the admin, then use it twice.
    const token = await apiLoginAdmin(request)
    const created = await request.post('/api/content-preview', { data: { path: '/en' }, headers: bearer(token) })
    expect(created.status()).toBe(200)
    const { url } = (await created.json()) as { url: string }

    const visitor = await browser.newContext()
    const first = await visitor.request.get(url, { maxRedirects: 0 })
    const second = await visitor.request.get(url, { maxRedirects: 0 })
    await visitor.close()
    expect(first.status()).toBe(307)
    expect(second.status()).toBe(401)
  })

  test('publishing puts the title on the public site', async ({ browser }) => {
    await page.goto('/super-admin/content/home')
    await expect(page.getByText('1 draft change not published yet')).toBeVisible()

    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(toast('Published — the public site is updated')).toBeVisible()
    await expect(page.getByText('Everything is published')).toBeVisible()
    await expect(page.getByText('Customized').first()).toBeVisible()

    expect(await asVisitor(browser, '/en', publicHeading)).toContain(TITLE_1)
  })

  test('a second edit is published, and History can restore the first', async ({ browser }) => {
    await page.goto('/super-admin/content/home')
    await fieldInput(page, HERO_TITLE_KEY, 'en').fill(TITLE_2)
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(toast(/Draft saved/)).toBeVisible()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(toast('Published — the public site is updated')).toBeVisible()
    expect(await asVisitor(browser, '/en', publicHeading)).toContain(TITLE_2)

    await fieldRow(page, HERO_TITLE_KEY).getByRole('button', { name: 'History' }).click()
    const history = page.getByRole('dialog', { name: /History/ })
    await expect(history).toBeVisible()
    await expect(history.getByText('Current')).toBeVisible()

    await history.getByRole('button', { name: 'Restore this version' }).first().click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Restore' }).click()
    await expect(toast('Restored — the public site is updated')).toBeVisible()

    expect(await asVisitor(browser, '/en', publicHeading)).toContain(TITLE_1)
  })

  test('"Use default" + publish puts the built-in title back', async ({ browser }) => {
    await page.goto('/super-admin/content/home')
    await fieldRow(page, HERO_TITLE_KEY).getByRole('button', { name: 'Use default' }).click()
    await page.getByRole('button', { name: 'Save draft' }).click()
    await expect(toast(/Draft saved/)).toBeVisible()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expect(toast('Published — the public site is updated')).toBeVisible()

    const heading = await asVisitor(browser, '/en', publicHeading)
    expect(heading).not.toContain(TITLE_1)
    expect(heading).not.toContain(TITLE_2)
  })

  test('Discard throws away unsaved typing', async () => {
    await page.goto('/super-admin/content/home')
    const before = await fieldInput(page, HERO_TITLE_KEY, 'en').inputValue()
    await fieldInput(page, HERO_TITLE_KEY, 'en').fill('typed but never saved')
    await expect(page.getByText('1 unsaved change')).toBeVisible()
    await page.getByRole('button', { name: 'Discard' }).click()
    await expect(fieldInput(page, HERO_TITLE_KEY, 'en')).toHaveValue(before)
  })
})

test.describe('editing a list (Stories on the home page)', () => {
  const storiesCard = () =>
    page
      .locator('[data-slot="card"]')
      .filter({ has: page.locator('[data-slot="card-title"]', { hasText: /^Stories$/ }) })
  // Only the ACTIVE stories (rows inside the "Recently removed" <details> are not counted).
  const rowNames = () => storiesCard().locator('xpath=.//li[not(ancestor::details)]//p[contains(@class,"font-medium")]').allTextContents()
  const removedCount = async () => {
    const summary = storiesCard().locator('summary')
    if ((await summary.count()) === 0) return 0
    return Number(/\((\d+)\)/.exec(await summary.innerText())?.[1] ?? 0)
  }
  let builtInCount = 0 // how many stories ship with the site (set by the first test)
  let removedBefore = 0

  test('"Customize" copies the built-in stories into the editor', async () => {
    await page.goto('/super-admin/content/home')
    await expect(storiesCard().getByText("Showing the website's built-in content.")).toBeVisible()
    await storiesCard().getByRole('button', { name: 'Customize' }).click()
    await expect(toast('Built-in content copied — you can now edit it')).toBeVisible()
    await expect(storiesCard().getByRole('button', { name: 'Add' })).toBeVisible()
    builtInCount = (await rowNames()).length
    expect(builtInCount).toBeGreaterThan(0)
  })

  test('an empty name is refused by the server and nothing is saved', async () => {
    await storiesCard().getByRole('button', { name: 'Add' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add item' })
    await dialog.locator('[id="item-quote-en"]').fill('A quote without a name')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(toast(/required/i)).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    expect((await rowNames()).length).toBe(builtInCount) // nothing was added
  })

  test('adding a story shows it in the editor and on the public site', async ({ browser }) => {
    await storiesCard().getByRole('button', { name: 'Add' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add item' })
    await dialog.locator('#item-name').fill(STORY_NAME)
    await dialog.locator('[id="item-quote-id"]').fill(STORY_QUOTE)
    await dialog.locator('[id="item-quote-en"]').fill('E2E test quote')
    await dialog.getByRole('button', { name: 'Save' }).click()

    await expect(toast('Saved — the public site is updated')).toBeVisible()
    await expect(storiesCard().getByText(STORY_NAME)).toBeVisible()
    expect(await asVisitor(browser, '/en', async (p) => p.getByText(STORY_NAME).first().isVisible())).toBe(true)
  })

  test('moving a story up changes the order', async () => {
    const before = await rowNames()
    expect(before.at(-1)).toBe(STORY_QUOTE)
    await storiesCard().locator('xpath=.//li[not(ancestor::details)]').last().getByTitle('Move up').click()
    await expect.poll(async () => (await rowNames()).indexOf(STORY_QUOTE)).toBe(builtInCount - 1)
  })

  test('removing a story hides it everywhere and lists it under "Recently removed"', async ({ browser }) => {
    removedBefore = await removedCount()
    await storiesCard().locator('li', { hasText: STORY_NAME }).getByTitle('Remove').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Remove' }).click()
    await expect(toast('Removed')).toBeVisible()
    await expect(storiesCard().getByText(`Recently removed (${removedBefore + 1})`)).toBeVisible()
    expect(await asVisitor(browser, '/en', async (p) => p.getByText(STORY_NAME).count())).toBe(0)
  })

  test('a removed story can be restored', async ({ browser }) => {
    await storiesCard().getByText(`Recently removed (${removedBefore + 1})`).click()
    await storiesCard().locator('details li', { hasText: STORY_NAME }).getByRole('button', { name: 'Restore' }).click()
    await expect(toast('Restored — the public site is updated')).toBeVisible()
    await expect(storiesCard().locator('li', { hasText: STORY_NAME }).getByTitle('Edit')).toBeVisible()
    expect(await asVisitor(browser, '/en', async (p) => p.getByText(STORY_NAME).first().isVisible())).toBe(true)
  })

  test('editing a story keeps it in place', async () => {
    await storiesCard().locator('li', { hasText: STORY_NAME }).getByTitle('Edit').click()
    const dialog = page.getByRole('dialog', { name: 'Edit item' })
    await dialog.locator('#item-name').fill(`${STORY_NAME} (edited)`)
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(toast('Saved — the public site is updated')).toBeVisible()
    await expect(storiesCard().getByText(`${STORY_NAME} (edited)`)).toBeVisible()
  })
})

test.describe('region names', () => {
  test('renaming a region updates the public list, and can be put back', async ({ request }) => {
    await page.goto('/super-admin/content/site')
    const inputs = page.locator('input[id^="region-"][id$="-en"]')
    await expect(inputs.first()).toBeVisible()

    let target = inputs.first()
    for (let i = 0; i < (await inputs.count()); i++) {
      if ((await inputs.nth(i).inputValue()) === 'North Maluku') target = inputs.nth(i)
    }
    await target.fill(`North Maluku ${RUN_ID}`)
    await page.locator('button:enabled', { hasText: /^Save$/ }).click()
    await expect
      .poll(async () => JSON.stringify(await (await request.get('/api/regions')).json()))
      .toContain(`North Maluku ${RUN_ID}`)

    for (let i = 0; i < (await inputs.count()); i++) {
      if ((await inputs.nth(i).inputValue()) === `North Maluku ${RUN_ID}`) await inputs.nth(i).fill('North Maluku')
    }
    await page.locator('button:enabled', { hasText: /^Save$/ }).click()
    await expect
      .poll(async () => JSON.stringify(await (await request.get('/api/regions')).json()))
      .not.toContain(RUN_ID)
  })
})

test.describe('journalist approval', () => {
  const email = `pending-${RUN_ID}@e2e.local`
  const password = 'Password123!'

  test('a freshly registered journalist is pending until a super admin approves them', async ({ request }) => {
    const registered = await request.post('/api/auth/register', { data: { email, password, name: `Pending ${RUN_ID}` } })
    expect(registered.status()).toBe(201)

    await page.goto('/super-admin/journalists')
    await page.getByPlaceholder('Search by name or email...').fill(email)
    const row = page.locator('tr', { hasText: email })
    await expect(row).toContainText('Pending')

    await row.getByTitle('Approve journalist').click()
    await expect(toast(/approved/)).toBeVisible()
    await expect(row).toContainText('Approved')
  })

  test('a journalist can be deactivated again', async () => {
    const row = page.locator('tr', { hasText: email })
    await row.getByTitle('Deactivate journalist').click()
    await page.getByRole('alertdialog').getByRole('button').last().click()
    await expect(toast(/deactivated/)).toBeVisible()
    await expect(row).toContainText('Pending')
  })

  test('a pending journalist cannot upload files', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email, password } })
    expect(login.status()).toBe(200)
    const { accessToken } = (await login.json()) as { accessToken: string }

    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    )
    const res = await request.post('/api/upload', {
      headers: bearer(accessToken),
      multipart: { file: { name: 'a.png', mimeType: 'image/png', buffer: png } },
    })
    expect(res.status()).toBe(403)
  })
})

test.describe('reviewing articles', () => {
  const makeSubmittedArticle = async (request: APIRequestContext, label: string) => {
    const token = await apiLoginJournalist(request)
    const created = await request.post('/api/articles', {
      headers: bearer(token),
      data: {
        sourceLocale: 'id',
        titleId: `Artikel ${label} ${RUN_ID}`,
        excerptId: 'Ringkasan artikel uji.',
        contentId: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Isi artikel uji e2e.' }] }] },
      },
    })
    expect(created.status()).toBe(201)
    const article = (await created.json()) as { id: string; slug: string }
    const submitted = await request.post(`/api/articles/${article.id}/submit`, { headers: bearer(token) })
    expect(submitted.status(), await submitted.text()).toBe(200)
    return article
  }

  test('approving a submitted article publishes it on the public site', async ({ browser, request }) => {
    const article = await makeSubmittedArticle(request, 'approve')
    await page.goto(`/super-admin/articles/${article.id}`)
    await page.getByRole('button', { name: 'Approve & Publish' }).click()
    // An article without an English translation asks for one more confirmation.
    const anyway = page.getByRole('alertdialog')
    const asked = await anyway.waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false)
    if (asked) await anyway.getByRole('button').last().click()
    await expect(toast('Article approved and published')).toBeVisible()

    const status = await asVisitor(browser, `/id/news/${article.slug}`, async (p) => p.locator('h1').first().innerText())
    expect(status).toContain(`Artikel approve ${RUN_ID}`)
  })

  test('rejecting a submitted article records the reason and keeps it off the public site', async ({ browser, request }) => {
    const article = await makeSubmittedArticle(request, 'reject')
    await page.goto(`/super-admin/articles/${article.id}`)
    await page.getByRole('button', { name: 'Reject', exact: true }).click()
    await page.locator('#rejectionReason').fill('Needs a source for the numbers.')
    await page.getByRole('button', { name: 'Confirm Reject' }).click()
    await expect(toast('Article rejected')).toBeVisible()

    // A real 404, and its content is not served.
    expect((await request.get(`/id/news/${article.slug}`)).status()).toBe(404)
    const html = await asVisitor(browser, `/id/news/${article.slug}`, (p) => p.content())
    expect(html).not.toContain(`Artikel reject ${RUN_ID}`)
    expect(html).not.toContain('Isi artikel uji e2e.')
  })

  test('the showcase slot can be switched to another published article, and back', async ({ browser }) => {
    await page.goto('/super-admin/dashboard')
    await page.getByRole('button', { name: 'Change' }).first().click()
    const dialog = page.getByRole('dialog', { name: /Select Article for Slot/ })
    await dialog.getByPlaceholder('Search published articles by title...').fill(`Artikel approve ${RUN_ID}`)
    await dialog.getByRole('button', { name: 'Select' }).first().click()
    await expect(toast('Showcase article updated')).toBeVisible()
    expect(await asVisitor(browser, '/id', async (p) => p.getByText(`Artikel approve ${RUN_ID}`).first().isVisible())).toBe(true)

    // put the seeded article back
    await page.getByRole('button', { name: 'Change' }).first().click()
    const again = page.getByRole('dialog', { name: /Select Article for Slot/ })
    await again.getByPlaceholder('Search published articles by title...').fill('Article in both languages')
    await again.getByRole('button', { name: 'Select' }).first().click()
    await expect(toast('Showcase article updated')).toBeVisible()
  })

  test('the admin article editor refuses a javascript: link and accepts an https one', async ({ browser, request }) => {
    const list = await request.get('/api/articles?limit=30')
    const seeded = ((await list.json()) as { items: Array<{ id: string; slug: string }> }).items.find((a) => a.slug === ARTICLE_BOTH)
    expect(seeded).toBeTruthy()

    await page.goto(`/super-admin/articles/${seeded!.id}/edit`)
    await page.locator('#reportUrl').fill('javascript:alert(1)')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(/valid http\(s\) URL/)).toBeVisible()

    await page.locator('#reportUrl').fill('https://example.org/e2e-report.pdf')
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast('Saved')).toBeVisible()

    const href = await asVisitor(browser, `/en/news/${ARTICLE_BOTH}`, async (p) =>
      p.locator('a[href="https://example.org/e2e-report.pdf"]').first().getAttribute('href'),
    )
    expect(href).toBe('https://example.org/e2e-report.pdf')
  })
})

test.describe('sign out', () => {
  test('signing out ends the session', async () => {
    await page.goto('/super-admin/dashboard')
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/super-admin\/auth\/login/)
    await page.goto('/super-admin/content')
    await expect(page).toHaveURL(/\/super-admin\/auth\/login/)
  })
})
