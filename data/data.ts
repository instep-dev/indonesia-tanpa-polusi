export type NavLinkKey =
  | 'latestNews'
  | 'sulawesi'
  | 'malukuUtara'
  | 'kalimantanUtara'
  | 'home'

export const navLinks = [
  { key: 'home', href: '/' },
  { key: 'latestNews', href: '/latest-news' },
  { key: 'sulawesi', href: '/sulawesi' },
  { key: 'malukuUtara', href: '/maluku-utara' },
  { key: 'kalimantanUtara', href: '/kalimantan-utara' },
] satisfies { key: NavLinkKey; href: string }[]

export const homeStoryCards = [
  { id: 'card-1', name: 'Parker G.' },
  { id: 'card-2', name: 'Charlie M.' },
] satisfies { id: string; name: string }[]

export type NewsCardId = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

export const homeNewsCards = [
  { id: 'sulawesi', href: '/sulawesi', image: '/news1.jpg' },
  { id: 'malukuUtara', href: '/maluku-utara', image: '/news2.jpg' },
  { id: 'kalimantanUtara', href: '/kalimantan-utara', image: '/news3.jpeg' },
] satisfies { id: NewsCardId; href: string; image: string }[]

export type RegionKey = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

export type RegionStoryCard = {
  id: string
  quote: string
  name: string
}

export const regionStories: Record<RegionKey, RegionStoryCard[]> = {
  sulawesi: [
    {
      id: 'sulawesi-story-1',
      quote:
        'Masyarakat Sulawesi bersatu menolak proyek yang mengancam kualitas udara dan kesehatan generasi mendatang.',
      name: 'Dewi W.',
    },
    {
      id: 'sulawesi-story-2',
      quote:
        'Kami ingin energi bersih yang adil, bukan emisi tersembunyi yang mengguncang kehidupan nelayan dan petani.',
      name: 'Romi A.',
    },
  ],
  malukuUtara: [
    {
      id: 'malukuUtara-story-1',
      quote:
        'Komunitas Maluku Utara percaya bahwa energi terbarukan dapat melindungi laut dan mata pencaharian nelayan.',
      name: 'Intan M.',
    },
    {
      id: 'malukuUtara-story-2',
      quote:
        'Kami menolak proyek dengan risiko tinggi karena dampaknya akan terasa jauh sampai generasi berikutnya.',
      name: 'Fajar H.',
    },
  ],
  kalimantanUtara: [
    {
      id: 'kalimantanUtara-story-1',
      quote:
        'Warga Kalimantan Utara mendesak pembatalan proyek yang dapat merusak hutan dan kualitas udara.',
      name: 'Laras S.',
    },
    {
      id: 'kalimantanUtara-story-2',
      quote:
        'Kami ingin masa depan dengan kemandirian energi yang tidak mengorbankan kesehatan anak-anak kami.',
      name: 'Riko D.',
    },
  ],
}

export const contactInfo = {
  email: 'indonesiatanpapolusi@gmail.com',
  socials: [
    { handle: '@indonesiatanpapolusi', href: 'https://instagram.com/indonesiatanpapolusi' },
    { handle: '@koalisi.sulosi', href: 'https://instagram.com/koalisi.sulosi' },
    { handle: '@malukuutaratanpapolusi', href: 'https://instagram.com/malukuutaratanpapolusi' },
    { handle: '@kalimantanutaratanpapolusi', href: 'https://instagram.com/kalimantanutaratanpapolusi' },
  ],
} satisfies { email: string; socials: { handle: string; href: string }[] }
