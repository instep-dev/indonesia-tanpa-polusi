export type NavLinkKey =
  | 'ourStories'
  | 'latestNews'
  | 'sulawesi'
  | 'malukuUtara'
  | 'kalimantanUtara'
  | 'contactUs'

export const navLinks = [
  { key: 'ourStories', href: '/our-stories' },
  { key: 'latestNews', href: '/latest-news' },
  { key: 'sulawesi', href: '/sulawesi' },
  { key: 'malukuUtara', href: '/maluku-utara' },
  { key: 'kalimantanUtara', href: '/kalimantan-utara' },
  { key: 'contactUs', href: '/contact-us' },
] satisfies { key: NavLinkKey; href: string }[]

export const homeStoryCards = [
  { id: 'card-1', name: 'Parker G.' },
  { id: 'card-2', name: 'Charlie M.' },
] satisfies { id: string; name: string }[]

export type NewsCardId = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

export const homeNewsCards = [
  { id: 'sulawesi', href: '/sulawesi' },
  { id: 'malukuUtara', href: '/maluku-utara' },
  { id: 'kalimantanUtara', href: '/kalimantan-utara' },
] satisfies { id: NewsCardId; href: string }[]

export const contactInfo = {
  email: 'indonesiatanpapolusi@gmail.com',
  socials: [
    { handle: '@indonesiatanpapolusi', href: 'https://instagram.com/indonesiatanpapolusi' },
    { handle: '@koalisi.sulosi', href: 'https://instagram.com/koalisi.sulosi' },
    { handle: '@malukuutaratanpapolusi', href: 'https://instagram.com/malukuutaratanpapolusi' },
    { handle: '@kalimantanutaratanpapolusi', href: 'https://instagram.com/kalimantanutaratanpapolusi' },
  ],
} satisfies { email: string; socials: { handle: string; href: string }[] }
