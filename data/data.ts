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

export type RegionKey = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

export type RegionStoryCard = {
  id: string
  quote: string
  name: string
}

export type RegionArticle = {
  id: string
  title: string
  excerpt: string
  href: string
}

export const regionPages: Record<RegionKey, { stories: RegionStoryCard[]; articles: RegionArticle[] }> = {
  sulawesi: {
    stories: [
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
    articles: [
      {
        id: 'sulawesi-article-1',
        title: 'Aksi Sulawesi Tolak PLTU Captive di Pantai Timur',
        excerpt:
          'Warga berkumpul untuk menuntut transparansi dan evaluasi dampak lingkungan dari rencana pembangunan PLTU baru.',
        href: '/sulawesi/article-1',
      },
      {
        id: 'sulawesi-article-2',
        title: 'Koalisi Pulau Sulawesi Mengadakan Diskusi Publik',
        excerpt:
          'Forum terbuka membahas alternatif energi bersih untuk menyelamatkan ekosistem pesisir dan pertanian lokal.',
        href: '/sulawesi/article-2',
      },
      {
        id: 'sulawesi-article-3',
        title: 'Laporan Kesehatan Masyarakat: Polusi Udara Meningkat',
        excerpt:
          'Data awal menunjukkan peningkatan kasus ISPA di wilayah yang terdampak emisi batu bara di Sulawesi.',
        href: '/sulawesi/article-3',
      },
    ],
  },
  malukuUtara: {
    stories: [
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
    articles: [
      {
        id: 'malukuUtara-article-1',
        title: 'Maluku Utara Serukan Energi Bersih untuk Komunitas Pulau',
        excerpt:
          'Siaran pers menekankan pentingnya energi terbarukan demi keberlangsungan sektor perikanan lokal.',
        href: '/maluku-utara/article-1',
      },
      {
        id: 'malukuUtara-article-2',
        title: 'Diskusi Publik: Dampak PLTU terhadap Lingkungan Laut',
        excerpt:
          'Para aktivis dan tokoh masyarakat membahas konsekuensi emisi terhadap kehidupan laut dan pesisir.',
        href: '/maluku-utara/article-2',
      },
      {
        id: 'malukuUtara-article-3',
        title: 'Kampanye Pendidikan Energi Bersih Menjangkau Sekolah-sekolah',
        excerpt:
          'Program literasi energi hadir untuk anak-anak dan keluarga di wilayah Maluku Utara.',
        href: '/maluku-utara/article-3',
      },
    ],
  },
  kalimantanUtara: {
    stories: [
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
    articles: [
      {
        id: 'kalimantanUtara-article-1',
        title: 'Kalimantan Utara Siap Memilih Energi Hijau',
        excerpt:
          'Koalisi setempat mendorong kebijakan yang mendukung transisi dari batu bara menuju solusi bersih.',
        href: '/kalimantan-utara/article-1',
      },
      {
        id: 'kalimantanUtara-article-2',
        title: 'Masyarakat Lokal Bersuara untuk Udara Sehat',
        excerpt:
          'Serangkaian pertemuan masyarakat membahas ancaman polusi pada kehidupan di kawasan penyangga hutan.',
        href: '/kalimantan-utara/article-2',
      },
      {
        id: 'kalimantanUtara-article-3',
        title: 'Aksi Damai di Kalimantan Utara Mendapat Dukungan Luas',
        excerpt:
          'Ribuan penduduk menyuarakan perlunya energi berkeadilan dan perlindungan lingkungan.',
        href: '/kalimantan-utara/article-3',
      },
    ],
  },
}

export const latestNewsArticles = [
  {
    id: 'article-1',
    title: 'Aksi Tuntutan di Monas Dorong Transparansi Proyek PLTU',
    excerpt:
      'Koalisi Indonesia Tanpa Polusi menggelar aksi damai di Monas untuk meminta keterbukaan informasi dan evaluasi terhadap rencana PLTU Captive.',
    href: '/latest-news/article-1',
  },
  {
    id: 'article-2',
    title: 'Laporan Baru: Dampak Udara Tercemar pada Kesehatan Masyarakat',
    excerpt:
      'Penelitian terbaru menunjukkan peningkatan ISPA dan gangguan pernapasan di komunitas yang terdampak emisi batu bara.',
    href: '/latest-news/article-2',
  },
  {
    id: 'article-3',
    title: 'Siaran Pers Koalisi: Pilih Energi Bersih untuk Masa Depan',
    excerpt:
      'Koalisi menyerukan kebijakan energi berkeadilan dan dukungan penuh bagi transisi dari bahan bakar fosil ke terbarukan.',
    href: '/latest-news/article-3',
  },
] satisfies { id: string; title: string; excerpt: string; href: string }[]

export const contactInfo = {
  email: 'indonesiatanpapolusi@gmail.com',
  socials: [
    { handle: '@indonesiatanpapolusi', href: 'https://instagram.com/indonesiatanpapolusi' },
    { handle: '@koalisi.sulosi', href: 'https://instagram.com/koalisi.sulosi' },
    { handle: '@malukuutaratanpapolusi', href: 'https://instagram.com/malukuutaratanpapolusi' },
    { handle: '@kalimantanutaratanpapolusi', href: 'https://instagram.com/kalimantanutaratanpapolusi' },
  ],
} satisfies { email: string; socials: { handle: string; href: string }[] }
