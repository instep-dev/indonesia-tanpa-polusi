# Home Page — Design Spec

Date: 2026-07-27
Status: Approved by user, ready for implementation planning

## Context

The marketing site has 7 planned pages: Home, Our Stories, Latest News (future CMS + Tiptap editor), Sulawesi, Maluku Utara, Kalimantan Utara, Contact Us. Only Home is in scope for this spec. Pages will be built one at a time; Home establishes the shared chrome (Navbar) and design tokens the rest will reuse.

The user supplied a pixel mockup (`Indonesia Tanpa Polusi (homepage).png`), exact Indonesian + English copy for every section, brand hex colors, and a logo file (`public/logo.png`). Goal: 100% visual match to the mockup, fully responsive, i18n-ready (id/en), dark-mode aware.

## Brand tokens

Add to `styles/globals.css` inside `@theme inline`, alongside the existing `--color-background` / `--color-foreground`:

```css
--color-brand-yellow: #fee251;
--color-brand-navy: #33477d;
```

These are constant across light and dark mode (brand colors don't swap with theme) — do **not** add them to the `.dark` override block. They become Tailwind utilities: `bg-brand-yellow`, `text-brand-navy`, etc.

Existing `--background` / `--foreground` (currently white/black, swapping to `#0a0a0a`/`#ededed` in `.dark`) continue to drive the two neutral (white-in-mockup) sections — About Us and Latest News — so those sections go dark in dark mode while the yellow and navy sections stay locked to brand color in both themes.

## Font

Replace `Geist` with `Manrope` in `app/layout.tsx` (`next/font/google`), rename the CSS variable (`--font-manrope`), and point `--font-sans` at it in `globals.css`. This is a site-wide change, not marketing-only — `Geist_Mono` stays as-is (unused currently, no reason to touch it).

## Logo

`public/logo.png` (already provided) is used directly — no placeholder needed for the logo mark, unlike the photo containers.

## Component architecture

```
layouts/MarketingLayout.tsx
  → becomes the marketing site chrome: accepts `locale`, renders <Navbar currentLocale={locale} /> then {children}
  → LangToggle moves from being rendered standalone in LocaleLayout to living inside Navbar

components/marketing/
  Navbar.tsx      — logo (public/logo.png), 6 nav links, search input (visual only, no handler), <LangToggle/>
  Hero.tsx        — rewrite of existing stub: full-bleed neutral-500 placeholder image, "Indonesia Tanpa Polusi" wordmark overlay top-left, title/subtitle overlay bottom-right per mockup
  AboutUs.tsx     — bg-background section, About Us narration (id/en from dict)
  OurStories.tsx  — bg-brand-yellow section, narration + 2 testimonial cards (neutral-500 photo placeholder + quote + name)
  LatestNews.tsx  — bg-background section, heading + "Click to see all news" CTA button + 3 news cards (photo placeholder + region title + excerpt + "Click to read news" CTA)
  ContactUs.tsx   — bg-brand-yellow section, Email + Social Media blocks, 4-photo placeholder grid

app/[locale]/(marketing)/(home)/page.tsx
  → server component, loads dict via getDictionary(locale), composes Hero/AboutUs/OurStories/LatestNews/ContactUs, passes relevant dict slice to each

components/reusable/Button.tsx
  → add a `yellow` cva variant (bg-brand-yellow, navy text) for the CTA buttons ("Click to see all news", "Click to read news")
```

**Rationale for the granularity**: Navbar and ContactUs are reused by the other 6 pages already on the roadmap (Contact Us has its own page; Navbar is site-wide chrome). Splitting each mockup section into its own single-purpose component keeps each page composition to "assemble pre-built sections," matching the CLAUDE.md convention that `components/marketing/` holds page-section components (Hero, Navbar, ContactUs are named explicitly as examples there).

## Data & i18n split

- **Translated copy** (headline, About Us narration, Our Stories narration, News section title) → `messages/en.json` / `messages/id.json` under `marketing.home.*`, using the exact copy the user supplied for both languages.
- **Nav labels** → `messages/en.json` / `messages/id.json` under `marketing.nav.*`.
- **Placeholder dummy content** (2 testimonial cards, 3 news cards) → structural fields (photo placeholder flag, name, region slug/href) go in `data/data.ts`; translatable text (quote body, lorem excerpt) goes in messages under `marketing.home.ourStories.cards[]` / `marketing.home.news.items[]`, keyed by index/id to match the data.ts entries. Content is the mockup's lorem-ipsum placeholder text as-is — this is dummy content until the CMS/Article feature lands.
- **Contact Us email + social handles** → not translated, live as plain constants in `data/data.ts` (same in both locales). Only the "Email" / "Social Media" labels are translated.
- **English label decision**: the mockup's "North Borneo" card is renamed to **"North Kalimantan"** in `en.json` for consistency with the site's actual page name ("Kalimantan Utara"). Indonesian stays "Kalimantan Utara".

## Nav links

`data/data.ts`'s `navLinks` is replaced with the full 7-page sitemap (label comes from messages, href is fixed structural data):

```
/our-stories, /latest-news, /sulawesi, /maluku-utara, /kalimantan-utara, /contact-us
```

These routes don't exist yet outside Home — they'll 404 until built in subsequent tasks. This is expected and not blocking.

## Search box

Rendered in Navbar as a plain styled `<input>` with no `onChange`/`onSubmit` wiring — visually complete, functionally inert. Revisit once the Article/CMS search backend exists.

## Responsiveness

All 5 sections must reflow to a single-column mobile layout (mockup is desktop-only reference): Navbar collapses nav links (hamburger or wrap — implementer's call, no mockup provided for mobile), Hero overlay text stacks and shrinks, Our Stories/Latest News/Contact Us grids collapse from 2-3 columns to 1.

## Out of scope

- Any other page besides Home (Our Stories, Latest News, Sulawesi, Maluku Utara, Kalimantan Utara, Contact Us) — future tasks.
- CMS/Tiptap/Article schema — future task, explicitly deferred by the user.
- Making the search box functional.
- Real photos — all images stay `bg-neutral-500` placeholder containers until the user supplies assets.
