import { expect as baseExpect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { ACCEPTED_IMAGE_URLS, REJECTED_IMAGE_URLS } from '../test/image-urls'
import { ARTICLE_BOTH } from './fixtures'
import { RUN_ID, apiLoginAdmin, apiLoginJournalist, asVisitor, bearer } from './helpers'

// The CMS API against the LOCAL throwaway database: what the mocked Jest tests cannot
// show — real queries, real constraints — plus how a real browser renders what was stored.

// `configure` returns a NEW expect (it does not change the global one), so use this one.
const expect = baseExpect.configure({ timeout: 20_000 })
test.describe.configure({ mode: 'serial' })
test.setTimeout(120_000)

const ABOUT_IMAGE = 'media.home.about.image'

const json = { 'content-type': 'application/json' }

const putField = (request: APIRequestContext, token: string, key: string, valueId: string) =>
  request.put('/api/site-content', { headers: { ...bearer(token), ...json }, data: { fields: [{ key, valueId, valueEn: '' }] } })

const storedValue = async (request: APIRequestContext, token: string, key: string) => {
  const res = await request.get('/api/site-content?page=home', { headers: bearer(token) })
  const body = (await res.json()) as { fields: Array<{ key: string; valueId: string | null }> }
  return body.fields.find((field) => field.key === key)?.valueId ?? null
}

let admin: string
let seededArticleId: string

test.beforeAll(async ({ request }) => {
  admin = await apiLoginAdmin(request)
  const all = await request.get('/api/articles?all=1', { headers: bearer(admin) })
  const articles = (await all.json()) as Array<{ id: string; slug: string }>
  seededArticleId = articles.find((a) => a.slug === ARTICLE_BOTH)!.id
})

test.describe('access control', () => {
  test('every admin endpoint refuses a request with no token', async ({ request }) => {
    const calls = [
      request.get('/api/site-content?page=home'),
      request.put('/api/site-content', { data: {} }),
      request.post('/api/site-content/drafts', { data: {} }),
      request.get('/api/users'),
      request.get('/api/content-items?collection=stories.home'),
      request.post('/api/content-items', { data: {} }),
      request.put('/api/content-items/reorder', { data: {} }),
      request.get('/api/content-revisions?page=home'),
      request.post('/api/content-revisions/x/restore'),
      request.patch('/api/regions/x', { data: {} }),
      request.put('/api/articles/main', { data: {} }),
      request.post(`/api/articles/${'x'}/review`, { data: {} }),
      request.post('/api/upload'),
      request.post('/api/content-preview', { data: {} }),
    ]
    const statuses = (await Promise.all(calls)).map((res) => res.status())
    expect(statuses).toEqual(statuses.map(() => 401))
  })

  test('a journalist token cannot use admin endpoints', async ({ request }) => {
    const journalist = await apiLoginJournalist(request)
    for (const path of ['/api/users', '/api/site-content?page=home', '/api/content-revisions?page=home']) {
      expect((await request.get(path, { headers: bearer(journalist) })).status(), path).toBe(401)
    }
    expect((await request.put('/api/articles/main', { headers: bearer(journalist), data: { articleIds: ['x'] } })).status()).toBe(401)
  })

  test('login: malformed bodies are 400, failed attempts are limited, and success is never counted', async ({ request }) => {
    for (const data of [{}, { email: 'a@b.c' }, { email: 42, password: 'x' }]) {
      expect((await request.post('/api/super-admin/auth/login', { data })).status()).toBe(400)
      expect((await request.post('/api/auth/login', { data })).status()).toBe(400)
    }

    const email = `brute-${RUN_ID}@e2e.local`
    for (let i = 0; i < 10; i++) {
      expect((await request.post('/api/super-admin/auth/login', { data: { email, password: 'wrong' } })).status()).toBe(401)
    }
    expect((await request.post('/api/super-admin/auth/login', { data: { email, password: 'wrong' } })).status()).toBe(429)

    // The real admin signs in as often as they like: only failures count.
    for (let i = 0; i < 12; i++) await apiLoginAdmin(request)
  })
})

test.describe('public pages answer with the right HTTP status (no soft 404s)', () => {
  // A loading boundary above the routes would make the server commit to 200 before
  // notFound() runs; these assertions guard against that coming back.
  const missing = ['/en/no-such-page', '/id/no-such-page', '/en/sulawesi/no-such-page', '/en/news/no-such-article', '/id/news/no-such-article']
  for (const path of missing) {
    test(`${path} is a real 404 that search engines are told not to index`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(404)
      expect(await res.text()).toMatch(/<meta name="robots" content="noindex"/)
    })
  }

  test('an unpublished (draft) article is a 404, a published one is a 200', async ({ request }) => {
    expect((await request.get('/en/news/e2e-draft-article')).status()).toBe(404)
    expect((await request.get('/id/news/e2e-draft-article')).status()).toBe(404)
    expect((await request.get(`/en/news/${ARTICLE_BOTH}`)).status()).toBe(200)
    expect((await request.get(`/id/news/${ARTICLE_BOTH}`)).status()).toBe(200)
  })

  test('real pages are 200 and are not marked noindex', async ({ request }) => {
    for (const path of ['/en', '/id', '/en/news', '/en/sulawesi', '/id/maluku-utara', '/en/kalimantan-utara']) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
      expect(await res.text(), path).not.toMatch(/<meta name="robots" content="noindex"/)
    }
  })

  // Next answers a real 404 with the status plus a small HTML shell; the not-found UI is then
  // drawn in the browser. So check what a visitor actually SEES, not the raw server HTML.
  test('in a browser the 404 shows the localized CMS page inside the site layout', async ({ page }) => {
    const response = await page.goto('/id/no-such-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toHaveAttribute('href', '/id')
    await expect(page.locator('nav').first()).toBeVisible() // the navbar from the locale layout
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
  })

  test('in a browser a missing article shows the article 404 with a link back to the news list', async ({ page }) => {
    const response = await page.goto('/en/news/no-such-article')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('404', { exact: true })).toBeVisible()
    await expect(page.locator('a[href="/en/news"]').last()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('signed-out dashboard areas still redirect to their login pages', async ({ request }) => {
    for (const [path, login] of [
      ['/dashboard', '/auth/login'],
      ['/super-admin/dashboard', '/super-admin/auth/login'],
    ]) {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status(), path).toBe(307)
      expect(res.headers().location, path).toContain(login)
    }
  })
})

test.describe('image URLs in CMS fields (real database)', () => {
  for (const [label, url] of ACCEPTED_IMAGE_URLS) {
    test(`stores ${label}`, async ({ request }) => {
      const res = await putField(request, admin, ABOUT_IMAGE, url)
      expect(res.status(), await res.text()).toBe(200)
      expect(await storedValue(request, admin, ABOUT_IMAGE)).toBe(url)
    })
  }

  for (const [label, url] of REJECTED_IMAGE_URLS) {
    test(`refuses ${label}`, async ({ request }) => {
      await putField(request, admin, ABOUT_IMAGE, '/news1.jpg')
      const res = await putField(request, admin, ABOUT_IMAGE, url)
      expect(res.status()).toBe(400)
      expect(await storedValue(request, admin, ABOUT_IMAGE)).toBe('/news1.jpg')
    })
  }

  test('a revision is recorded for each save, by the admin who made it', async ({ request }) => {
    const res = await request.get(`/api/content-revisions?kind=field&target=${ABOUT_IMAGE}`, { headers: bearer(admin) })
    const revisions = (await res.json()) as Array<{ createdByName: string; action: string }>
    expect(revisions.length).toBeGreaterThan(1)
    expect(revisions.every((revision) => revision.createdByName === 'E2E Admin')).toBe(true)
  })

  test('the public home page renders each kind correctly in a real browser', async ({ browser, request }) => {
    const external = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&w=1200'
    const cases: Array<[string, string, (src: string | null) => void]> = [
      ['external site', external, (src) => expect(src).toBe(external)], // served as-is, never through the optimizer
      ['public/ path', '/news1.jpg', (src) => expect(src).toContain('/_next/image?url=%2Fnews1.jpg')],
      [
        'our own R2 host',
        'https://media.indonesiatanpapolusi.org/site/admin_1/a.jpg',
        (src) => expect(src).toContain('/_next/image?url=https%3A%2F%2Fmedia.indonesiatanpapolusi.org'),
      ],
    ]

    for (const [, url, assertSrc] of cases) {
      expect((await putField(request, admin, ABOUT_IMAGE, url)).status()).toBe(200)
      const src = await asVisitor(browser, '/en', async (page) => {
        const img = page.locator('#about img').first()
        await expect(img).toBeAttached()
        return img.getAttribute('src')
      })
      assertSrc(src)
    }
  })

  test('resetting the field brings the built-in image back', async ({ request, browser }) => {
    expect((await putField(request, admin, ABOUT_IMAGE, '')).status()).toBe(200)
    expect(await storedValue(request, admin, ABOUT_IMAGE)).toBeNull()
    const src = await asVisitor(browser, '/en', (page) => page.locator('#about img').first().getAttribute('src'))
    expect(src).toContain('about.jpg')
  })
})

test.describe('article images (real database)', () => {
  const patchCover = (request: APIRequestContext, coverImage: string | null) =>
    request.patch(`/api/articles/${seededArticleId}`, { headers: { ...bearer(admin), ...json }, data: { coverImage } })

  for (const [label, url] of ACCEPTED_IMAGE_URLS) {
    test(`an admin can set the cover to ${label}`, async ({ request }) => {
      const res = await patchCover(request, url)
      expect(res.status(), await res.text()).toBe(200)
      expect(((await res.json()) as { coverImage: string }).coverImage).toBe(url)
    })
  }

  for (const [label, url] of REJECTED_IMAGE_URLS) {
    test(`an admin cannot set the cover to ${label}`, async ({ request }) => {
      await patchCover(request, '/news1.jpg')
      expect((await patchCover(request, url)).status()).toBe(400)
    })
  }

  test('an external cover is shown as-is on the article page', async ({ request, browser }) => {
    const url = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_800/v1/sample.jpg'
    expect((await patchCover(request, url)).status()).toBe(200)
    const src = await asVisitor(browser, `/en/news/${ARTICLE_BOTH}`, (page) =>
      page.locator('#hero-viewport img').first().getAttribute('src'),
    )
    expect(src).toBe(url)
  })

  test('a hostile cover URL cannot inject CSS into the news list', async ({ request, browser }) => {
    // Parentheses and quotes are legal in URLs, so this IS stored; the page must keep it inside url("…").
    const hostile = 'https://example.org/a.jpg");position:fixed;inset:0;background:red;x:url("https://example.org/b.jpg'
    expect((await patchCover(request, hostile)).status()).toBe(200)

    const result = await asVisitor(browser, '/en/news', async (page) => {
      // The card of the article that has a cover (cover-less cards carry no inline style).
      const card = page.locator('div.bg-cover[style*="background-image"]').first()
      await expect(card).toBeAttached()
      return card.evaluate((el) => ({
        position: getComputedStyle(el).position,
        backgroundColor: getComputedStyle(el).backgroundColor,
        backgroundImage: getComputedStyle(el).backgroundImage,
      }))
    })
    expect(result.position).not.toBe('fixed')
    expect(result.backgroundColor).not.toBe('rgb(255, 0, 0)')
    expect(result.backgroundImage).toContain('example.org/a.jpg')
  })

  test('gallery images: public/ path, other site and R2 are accepted; unsafe values are refused', async ({ request }) => {
    const add = (url: string) =>
      request.post(`/api/articles/${seededArticleId}/images`, { headers: { ...bearer(admin), ...json }, data: { url } })
    for (const [, url] of ACCEPTED_IMAGE_URLS) expect((await add(url)).status(), url).toBe(201)
    for (const [, url] of REJECTED_IMAGE_URLS) expect((await add(url)).status(), url).toBe(400)
  })

  test('a journalist can create an article with any acceptable cover, and not with an unsafe one', async ({ request }) => {
    const journalist = await apiLoginJournalist(request)
    const create = (coverImage: string) =>
      request.post('/api/articles', {
        headers: { ...bearer(journalist), ...json },
        data: { sourceLocale: 'en', titleEn: `Cover test ${RUN_ID}`, coverImage },
      })
    for (const [, url] of ACCEPTED_IMAGE_URLS) expect((await create(url)).status(), url).toBe(201)
    for (const [, url] of REJECTED_IMAGE_URLS) expect((await create(url)).status(), url).toBe(400)
  })

  test('the original cover is put back', async ({ request }) => {
    expect((await patchCover(request, '/news1.jpg')).status()).toBe(200)
  })
})

test.describe('article links (real database)', () => {
  test('unsafe external links are refused, http(s) links are stored', async ({ request }) => {
    const patch = (data: Record<string, string | null>) =>
      request.patch(`/api/articles/${seededArticleId}`, { headers: { ...bearer(admin), ...json }, data })

    for (const bad of ['javascript:alert(1)', 'data:text/html,<script>1</script>', 'ftp://example.org/x', '//evil.example/x', 'not a url']) {
      expect((await patch({ reportUrl: bad })).status(), bad).toBe(400)
      expect((await patch({ pressReleaseUrl: bad })).status(), bad).toBe(400)
      expect((await patch({ visualUrl: bad })).status(), bad).toBe(400)
    }
    expect((await patch({ pressReleaseUrl: 'https://example.org/press' })).status()).toBe(200)
    expect((await patch({ pressReleaseUrl: null })).status()).toBe(200)
  })
})

test.describe('homepage showcase articles (real database)', () => {
  const putMain = (request: APIRequestContext, articleIds: unknown) =>
    request.put('/api/articles/main', { headers: { ...bearer(admin), ...json }, data: { articleIds } })

  test('a repeated id counts once', async ({ request }) => {
    expect((await putMain(request, [seededArticleId, seededArticleId])).status()).toBe(200)
    const all = await request.get('/api/articles?all=1', { headers: bearer(admin) })
    const mains = ((await all.json()) as Array<{ isMain: boolean }>).filter((article) => article.isMain)
    expect(mains).toHaveLength(1)
  })

  test('a soft-deleted article can no longer be pinned', async ({ request }) => {
    const journalist = await apiLoginJournalist(request)
    const created = await request.post('/api/articles', {
      headers: { ...bearer(journalist), ...json },
      data: { sourceLocale: 'en', titleEn: `To be deleted ${RUN_ID}` },
    })
    const { id } = (await created.json()) as { id: string }
    // Soft-delete it as the admin (the row stays; "published" is checked first, so publish it by force of DB state is not needed:
    // the deleted check must hold regardless of status).
    expect((await request.delete(`/api/articles/${id}`, { headers: bearer(admin) })).status()).toBe(200)

    const res = await putMain(request, [seededArticleId, id])
    expect(res.status()).toBe(404)
  })

  test('bad input is a clean 400', async ({ request }) => {
    expect((await putMain(request, 'nope')).status()).toBe(400)
    expect((await putMain(request, [{ id: 'x' }])).status()).toBe(400)
    expect((await putMain(request, [])).status()).toBe(400)
    expect((await putMain(request, ['a', 'b', 'c', 'd'])).status()).toBe(400)
    const invalid = await request.put('/api/articles/main', { headers: { ...bearer(admin), ...json }, data: '{nope' })
    expect(invalid.status()).toBe(400)
  })
})

test.describe('list items with images (real database)', () => {
  test('a story photo can be a public/ path, another site or R2 — and unsafe values are refused', async ({ request }) => {
    const base = { quote: { id: 'Kutipan', en: 'Quote' }, name: `Photo test ${RUN_ID}` }
    const create = (imageUrl: string) =>
      request.post('/api/content-items', {
        headers: { ...bearer(admin), ...json },
        data: { collection: 'stories.home', data: { ...base, imageUrl } },
      })

    const kinds = [
      '/stories.jpeg',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
      'https://media.indonesiatanpapolusi.org/site/admin_1/a.jpg',
    ]
    for (const url of kinds) {
      const res = await create(url)
      expect(res.status(), await res.text()).toBe(201)
      const [item] = (await res.json()) as Array<{ id: string; data: { imageUrl: string } }>
      expect(item.data.imageUrl).toBe(url)
      // soft-delete again so the list stays under its size limit
      expect((await request.delete(`/api/content-items/${item.id}`, { headers: bearer(admin) })).status()).toBe(200)
    }
    for (const [, url] of REJECTED_IMAGE_URLS) expect((await create(url)).status(), url).toBe(400)
  })

  test('a list refuses to grow past its maximum size, and removing an item frees a place', async ({ request }) => {
    const headers = { ...bearer(admin), ...json }
    const add = (name: string) =>
      request.post('/api/content-items', {
        headers,
        data: { collection: 'stories.home', data: { quote: { id: 'K', en: 'Q' }, name, imageUrl: '' } },
      })
    const listing = async () =>
      ((await (await request.get('/api/content-items?collection=stories.home', { headers: bearer(admin) })).json()) as {
        items: Array<{ id: string }>
      }).items

    const added: string[] = []
    // Fill the list (6 stories at most), then try one more.
    for (let guard = 0; guard < 10 && (await listing()).length < 6; guard++) {
      const res = await add(`Filler ${RUN_ID}-${guard}`)
      expect(res.status(), await res.text()).toBe(201)
      added.push(((await res.json()) as Array<{ id: string }>)[0].id)
    }
    expect((await listing()).length).toBe(6)
    const over = await add(`One too many ${RUN_ID}`)
    expect(over.status()).toBe(400)
    expect(await over.text()).toContain('at most 6')

    // Removing one frees a place again.
    expect((await request.delete(`/api/content-items/${added[0]}`, { headers: bearer(admin) })).status()).toBe(200)
    const again = await add(`Fits again ${RUN_ID}`)
    expect(again.status()).toBe(201)
    added.push(((await again.json()) as Array<{ id: string }>)[0].id)

    // tidy up: soft-delete what this test added so the UI spec starts from the built-in list
    for (const id of added.slice(1)) await request.delete(`/api/content-items/${id}`, { headers: bearer(admin) })
  })
})
