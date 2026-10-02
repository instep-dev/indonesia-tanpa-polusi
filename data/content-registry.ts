import type { RegionKey } from '@/data/data'

// ─── Content registry ─────────────────────────────────────────────────────
// Single declaration of every public-site field the super-admin CMS can edit.
//
//  • Copy fields (no `fallback`) are keyed by their path in messages/*.json
//    (e.g. `marketing.home.hero.title`) — the messages file IS the default.
//  • Value fields (media, links, email) carry their built-in default in
//    `valueDefaults` below, so a missing DB row never changes the site.
//
// The admin UI, the API validation and the public loaders are all generated
// from this file — adding an editable field is a one-line change here.

/** `paragraphs` = several paragraphs edited as one text box (blank line between them). */
export type FieldType = 'text' | 'textarea' | 'paragraphs' | 'image' | 'video' | 'link'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  /** true → separate Indonesian / English values (valueId / valueEn). */
  localized: boolean
  /** Built-in default for value fields. Undefined for message-backed copy. */
  fallback?: string
}

export type SectionDef = {
  id: string
  title: string
  description?: string
  fields: FieldDef[]
}

export type ItemFieldDef = {
  name: string
  label: string
  type: FieldType | 'select'
  localized: boolean
  /** Choices for a `select` field. */
  options?: ReadonlyArray<{ value: string; label: string }>
  /** May be left empty. Defaults to true for images, false otherwise. */
  optional?: boolean
}

export type CollectionDef = {
  id: string
  title: string
  description?: string
  itemFields: ItemFieldDef[]
  maxItems: number
}

export type PageDef = {
  /** Show the "Region names" editor (the only editor that edits existing Region rows). */
  showRegionNames?: boolean
  slug: ContentPageSlug
  title: string
  description: string
  sections: SectionDef[]
  collections: CollectionDef[]
}

export type ContentPageSlug =
  | 'home'
  | 'sulawesi'
  | 'maluku-utara'
  | 'kalimantan-utara'
  | 'news'
  | 'site'
  | 'seo'

// ─── Built-in defaults for non-message values ─────────────────────────────

export const valueDefaults = {
  // Home
  'media.home.hero.video': '/heros.compressed.mp4',
  'media.home.hero.ctaHref': '#about',
  'media.home.about.image': '/about.jpg',
  'media.home.about.ctaHref': '#stories',
  'media.home.news.fallbackCover': '/news1.jpg',

  // Regions — hero + about images
  'media.regions.sulawesi.heroImage': '/sulawesi.jpg',
  'media.regions.sulawesi.aboutImage': '/about.jpg',
  'media.regions.malukuUtara.heroImage': '/maluku_utara.jpg',
  'media.regions.malukuUtara.aboutImage': '/about.jpg',
  'media.regions.kalimantanUtara.heroImage': '/kaltara.jpeg',
  'media.regions.kalimantanUtara.aboutImage': '/about.jpg',

  // News list
  'media.latestNews.heroImage': '/aksi-pltu-captive.jpg',

  // Navbar logos: `overHero` shows over the (transparent) hero, `scrolled` once the bar turns solid
  'media.logos.default.overHero': '/updated-logos/Indonesia/logo-navbar-white.png',
  'media.logos.default.scrolled': '/updated-logos/Indonesia/logo-navbar-blue.png',
  'media.logos.sulawesi.overHero': '/updated-logos/Sulosi/logo-sulosi-blue.png',
  'media.logos.sulawesi.scrolled': '/updated-logos/Sulosi/logo-sulosi-yellow.png',
  'media.logos.malukuUtara.overHero': '/updated-logos/Malut/logo-malut-blue.png',
  'media.logos.malukuUtara.scrolled': '/updated-logos/Malut/logo-malut-yellow.png',
  'media.logos.kalimantanUtara.overHero': '/updated-logos/Kaltara/logo-kaltara-blue.png',
  'media.logos.kalimantanUtara.scrolled': '/updated-logos/Kaltara/logo-kaltara-yellow.png',

  // Footer / contact
  'site.contact.email': 'indonesiatanpapolusi@gmail.com',
  'media.contact.collage1': '/footer.jpeg',
  'media.contact.collage2': '/portrait.jpeg',
  'media.contact.collage3': '/maluku.jpg',
  'media.contact.collage4': '/portrait1.jpeg',

  // SEO social-share images (empty = none)
  'seo.home.ogImage': '',
  'seo.sulawesi.ogImage': '',
  'seo.malukuUtara.ogImage': '',
  'seo.kalimantanUtara.ogImage': '',
  'seo.news.ogImage': '',
} as const satisfies Record<string, string>

export type ValueKey = keyof typeof valueDefaults

export const socialPlatforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
] as const

export type SocialPlatform = (typeof socialPlatforms)[number]['value']

export const DEFAULT_SOCIAL_PLATFORM: SocialPlatform = 'instagram'

/** Default story photos, matched by position (what OurStories hardcoded before). */
export const defaultStoryImages = ['/stories.jpeg', '/stories1.jpeg'] as const

// ─── Field builders ───────────────────────────────────────────────────────

const copy = (key: string, label: string, type: 'text' | 'textarea' | 'paragraphs' = 'text'): FieldDef => ({
  key,
  label,
  type,
  localized: true,
})

const value = (key: ValueKey, label: string, type: FieldType, localized = false): FieldDef => ({
  key,
  label,
  type,
  localized,
  fallback: valueDefaults[key],
})

const storyItemFields: ItemFieldDef[] = [
  { name: 'quote', label: 'Quote', type: 'textarea', localized: true },
  { name: 'name', label: 'Name', type: 'text', localized: false },
  { name: 'imageUrl', label: 'Photo', type: 'image', localized: false },
]

const storyCollection = (id: string, title: string): CollectionDef => ({
  id,
  title,
  description: 'Story cards shown in the "Our Stories" section, in this order.',
  itemFields: storyItemFields,
  maxItems: 6,
})

// ─── Regions ──────────────────────────────────────────────────────────────

type RegionMeta = { key: RegionKey; slug: ContentPageSlug; label: string }

export const regionMeta: RegionMeta[] = [
  { key: 'sulawesi', slug: 'sulawesi', label: 'Sulawesi' },
  { key: 'malukuUtara', slug: 'maluku-utara', label: 'Maluku Utara' },
  { key: 'kalimantanUtara', slug: 'kalimantan-utara', label: 'Kalimantan Utara' },
]

const regionPage = ({ key, slug, label }: RegionMeta): PageDef => {
  const base = `marketing.home.regions.${key}`
  const imageKey = (name: 'heroImage' | 'aboutImage') => `media.regions.${key}.${name}` as ValueKey
  const logoKey = (name: 'overHero' | 'scrolled') => `media.logos.${key}.${name}` as ValueKey

  return {
    slug,
    title: label,
    description: `The ${label} regional page.`,
    sections: [
      {
        id: 'hero',
        title: 'Hero',
        fields: [
          copy(`${base}.hero.title`, 'Title', 'textarea'),
          copy(`${base}.hero.subtitle`, 'Subtitle', 'textarea'),
          value(imageKey('heroImage'), 'Background image', 'image'),
        ],
      },
      {
        id: 'about',
        title: 'About',
        fields: [
          copy(`${base}.about.heading`, 'Heading'),
          copy(`${base}.about.body`, 'Text (blank line between paragraphs)', 'paragraphs'),
          value(imageKey('aboutImage'), 'Image', 'image'),
        ],
      },
      {
        id: 'stories',
        title: 'Our Stories (text)',
        fields: [
          copy(`${base}.ourStories.heading`, 'Heading'),
          copy(`${base}.ourStories.body`, 'Intro', 'textarea'),
        ],
      },
      {
        id: 'news',
        title: 'Latest news (text)',
        fields: [
          copy(`${base}.news.heading`, 'Heading'),
          copy(`${base}.news.intro`, 'Intro', 'textarea'),
        ],
      },
      {
        id: 'logos',
        title: 'Navbar logos',
        description: 'Shown in the navbar while on this regional page.',
        fields: [
          value(logoKey('overHero'), 'Logo over the hero', 'image'),
          value(logoKey('scrolled'), 'Logo after scrolling', 'image'),
        ],
      },
    ],
    collections: [storyCollection(`stories.${key}`, 'Stories')],
  }
}

// ─── Pages ────────────────────────────────────────────────────────────────

const homePage: PageDef = {
  slug: 'home',
  title: 'Home',
  description: 'Hero, About Us, Our Stories and the latest-news section.',
  sections: [
    {
      id: 'hero',
      title: 'Hero',
      fields: [
        copy('marketing.home.hero.title', 'Title', 'textarea'),
        copy('marketing.home.hero.subtitle', 'Subtitle', 'textarea'),
        copy('marketing.home.hero.cta', 'Button text'),
        value('media.home.hero.ctaHref', 'Button link', 'link'),
        value('media.home.hero.video', 'Background video URL', 'video'),
      ],
    },
    {
      id: 'about',
      title: 'About Us',
      fields: [
        copy('marketing.home.about.label', 'Label'),
        copy('marketing.home.about.title', 'Title', 'textarea'),
        copy('marketing.home.about.body', 'Text (blank line between paragraphs)', 'paragraphs'),
        copy('marketing.home.about.cta', 'Button text'),
        value('media.home.about.ctaHref', 'Button link', 'link'),
        value('media.home.about.image', 'Image', 'image'),
      ],
    },
    {
      id: 'stories',
      title: 'Our Stories (text)',
      fields: [
        copy('marketing.home.ourStories.heading', 'Heading'),
        copy('marketing.home.ourStories.body', 'Intro', 'textarea'),
      ],
    },
    {
      id: 'news',
      title: 'Latest news section',
      description: 'Also used for the button labels on the News page and the regional pages.',
      fields: [
        copy('marketing.home.news.heading', 'Heading'),
        copy('marketing.home.news.intro', 'Intro', 'textarea'),
        copy('marketing.home.news.viewAllCta', '"See all news" button'),
        copy('marketing.home.news.readCta', '"Read news" button'),
        copy('marketing.home.news.generalLabel', 'Label for articles without a region'),
        value('media.home.news.fallbackCover', 'Cover used when an article has none', 'image'),
      ],
    },
  ],
  collections: [storyCollection('stories.home', 'Stories')],
}

const newsPage: PageDef = {
  slug: 'news',
  title: 'News',
  description: 'News list page and the "About this news" block on article pages.',
  sections: [
    {
      id: 'hero',
      title: 'News list hero',
      fields: [
        copy('marketing.latestNews.hero.heading', 'Title'),
        copy('marketing.latestNews.hero.subtitle', 'Subtitle', 'textarea'),
        value('media.latestNews.heroImage', 'Background image', 'image'),
      ],
    },
    {
      id: 'list',
      title: 'News list labels',
      fields: [
        copy('marketing.home.news.searchPlaceholder', 'Search placeholder'),
        copy('marketing.home.news.loading', 'Loading'),
        copy('marketing.home.news.loadingMore', 'Loading more'),
        copy('marketing.home.news.empty', 'Nothing published yet'),
        copy('marketing.home.news.noResults', 'No search results'),
        copy('marketing.home.news.error', 'Error message'),
        copy('marketing.home.news.retry', 'Retry button'),
      ],
    },
    {
      id: 'detail',
      title: 'Article page: "About this news"',
      fields: [
        copy('marketing.newsDetail.noContent', 'Shown when an article has no text'),
        copy('marketing.newsDetail.contentError', 'Shown when an article cannot be displayed'),
        copy('marketing.newsDetail.about.heading', 'Heading'),
        copy('marketing.newsDetail.about.description', 'Description', 'textarea'),
        ...([0, 1, 2] as const).flatMap((index) => [
          copy(`marketing.newsDetail.about.cards.${index}.title`, `Card ${index + 1} title`),
          copy(
            `marketing.newsDetail.about.cards.${index}.description`,
            `Card ${index + 1} description`,
            'textarea',
          ),
          copy(`marketing.newsDetail.about.cards.${index}.cta`, `Card ${index + 1} button`),
        ]),
      ],
    },
  ],
  collections: [],
}

const sitePage: PageDef = {
  showRegionNames: true,
  slug: 'site',
  title: 'Navigation & footer',
  description: 'Navbar labels and logos, and the contact footer shown on every page.',
  sections: [
    {
      id: 'nav',
      title: 'Navbar labels',
      fields: [
        copy('marketing.nav.home', 'Home'),
        copy('marketing.nav.sulawesi', 'Sulawesi'),
        copy('marketing.nav.malukuUtara', 'Maluku Utara'),
        copy('marketing.nav.kalimantanUtara', 'Kalimantan Utara'),
        copy('marketing.nav.latestNews', 'News'),
        copy('marketing.nav.searchPlaceholder', 'Search'),
        copy('marketing.nav.login', 'Login'),
        copy('marketing.nav.logoAlt', 'Logo alt text'),
        copy('marketing.nav.toggleMenu', 'Mobile menu button (screen-reader label)'),
        copy('marketing.nav.switchLanguage', 'Language switch (screen-reader label, followed by the language code)'),
      ],
    },
    {
      id: 'logos',
      title: 'Default navbar logos',
      description: 'Used on the home and news pages. Regional pages have their own logos.',
      fields: [
        value('media.logos.default.overHero', 'Logo over the hero', 'image'),
        value('media.logos.default.scrolled', 'Logo after scrolling', 'image'),
      ],
    },
    {
      id: 'contact',
      title: 'Contact footer',
      fields: [
        copy('marketing.home.contact.heading', 'Heading'),
        copy('marketing.home.contact.emailLabel', 'Email label'),
        copy('marketing.home.contact.socialLabel', 'Social media label'),
        value('site.contact.email', 'Email address', 'text'),
      ],
    },
    {
      id: 'errors',
      title: 'Page not found (404)',
      description: 'The generic 404 page, and the page shown for a missing or unpublished article.',
      fields: [
        copy('marketing.notFound.title', 'Generic 404: title'),
        copy('marketing.notFound.body', 'Generic 404: text', 'textarea'),
        copy('marketing.notFound.backCta', 'Generic 404: button'),
        copy('marketing.newsDetail.notFoundTitle', 'Missing article: title'),
        copy('marketing.newsDetail.notFoundBody', 'Missing article: text', 'textarea'),
        copy('marketing.newsDetail.backCta', 'Missing article: button'),
      ],
    },
    {
      id: 'collage',
      title: 'Footer photos',
      description: 'Fixed layout: three on the left, one tall photo on the right.',
      fields: [
        value('media.contact.collage1', 'Left, top', 'image'),
        value('media.contact.collage2', 'Left, middle', 'image'),
        value('media.contact.collage3', 'Left, bottom', 'image'),
        value('media.contact.collage4', 'Right (tall)', 'image'),
      ],
    },
  ],
  collections: [
    {
      id: 'contact.socials',
      title: 'Social media accounts',
      description: 'Listed in the footer, in this order.',
      itemFields: [
        { name: 'handle', label: 'Handle', type: 'text', localized: false },
        { name: 'href', label: 'Link', type: 'link', localized: false },
        {
          name: 'platform',
          label: 'Platform (sets the icon)',
          type: 'select',
          localized: false,
          options: socialPlatforms,
          optional: true,
        },
      ],
      maxItems: 8,
    },
  ],
}

const SEO_PAGES = [
  { key: 'home', label: 'Home' },
  { key: 'sulawesi', label: 'Sulawesi' },
  { key: 'malukuUtara', label: 'Maluku Utara' },
  { key: 'kalimantanUtara', label: 'Kalimantan Utara' },
  { key: 'news', label: 'News list' },
] as const

const seoPage: PageDef = {
  slug: 'seo',
  title: 'SEO',
  description: 'Browser-tab title, search-result description and social-share image per page.',
  sections: SEO_PAGES.map(({ key, label }) => ({
    id: key,
    title: label,
    fields: [
      copy(`marketing.seo.${key}.title`, 'Page title'),
      copy(`marketing.seo.${key}.description`, 'Description', 'textarea'),
      value(`seo.${key}.ogImage` as ValueKey, 'Social-share image', 'image'),
    ],
  })),
  collections: [],
}

export const contentPages: PageDef[] = [
  homePage,
  ...regionMeta.map(regionPage),
  newsPage,
  sitePage,
  seoPage,
]

// ─── Lookups ──────────────────────────────────────────────────────────────

export const allFields: FieldDef[] = contentPages.flatMap((page) =>
  page.sections.flatMap((section) => section.fields),
)

export const fieldsByKey: ReadonlyMap<string, FieldDef> = new Map(
  allFields.map((field) => [field.key, field]),
)

export const allCollections: CollectionDef[] = contentPages.flatMap((page) => page.collections)

export const collectionsById: ReadonlyMap<string, CollectionDef> = new Map(
  allCollections.map((collection) => [collection.id, collection]),
)

export const getContentPage = (slug: string): PageDef | undefined =>
  contentPages.find((page) => page.slug === slug)

/** Value fields hold their default in `valueDefaults`; copy fields live in messages. */
export const isValueField = (field: FieldDef): boolean => field.fallback !== undefined
