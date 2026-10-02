import Link from 'next/link'
import {
  EnvelopeSimple,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  WhatsappLogo,
  XLogo,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import type { SocialPlatform } from '@/data/content-registry'
import type { Dictionary } from '@/i18n/getDictionary'
import type { ContactCollage, SocialItem } from '@/libs/contentMerge'
import Image from 'next/image'

const PLATFORM_ICONS: Record<SocialPlatform, Icon> = {
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  x: XLogo,
  youtube: YoutubeLogo,
  tiktok: TiktokLogo,
  whatsapp: WhatsappLogo,
  linkedin: LinkedinLogo,
  email: EnvelopeSimple,
}

type ContactInfo = {
  email: string
  socials: SocialItem[]
  collage: ContactCollage
}

const ContactUs = ({
  dict,
  contact,
}: {
  dict: Dictionary['marketing']['home']['contact']
  contact: ContactInfo
}) => (
  <section className="bg-brand-yellow px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <h2 className="text-3xl font-tilt-warp text-[#4E88C9] font-stretch-50% sm:text-4xl">
          {dict.heading}
        </h2>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-brand-navy">{dict.emailLabel}</h3>
          <p className="mt-1 text-brand-navy">{contact.email}</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-brand-navy">{dict.socialLabel}</h3>
          <ul className="mt-2 space-y-1">
            {contact.socials.map((social) => {
              const PlatformIcon = PLATFORM_ICONS[social.platform]
              return (
                <li key={social.id}>
                  <Link
                    href={social.href}
                    className="flex items-center gap-2 text-brand-navy hover:text-[#4E88C9]"
                  >
                    <PlatformIcon size={18} weight="fill" />
                    <span>{social.handle}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-4">
          <div className="rounded-sm border-1 shadow-md/20">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-500">
              <Image src={contact.collage[0]} alt={''} fill className="object-cover" />
            </div>
          </div>
          <div className="rounded-sm border-1 shadow-md/20">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-500">
              <Image src={contact.collage[1]} alt={''} fill className="object-cover" />
            </div>
          </div>
          <div className="rounded-sm border-1 shadow-md/20">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-neutral-500">
              <Image src={contact.collage[2]} alt={''} fill className="object-cover" />
            </div>
          </div>
        </div>
        <div className="flex rounded-sm border-1 shadow-md/20 sm:h-full">
          <div className="relative aspect-[4/3] w-full flex-1 overflow-hidden rounded-sm bg-neutral-500 sm:aspect-auto">
            <Image src={contact.collage[3]} alt={''} fill className="object-cover" />
          </div>
        </div>
      </div>
    </div>
  </section>
)

export default ContactUs
