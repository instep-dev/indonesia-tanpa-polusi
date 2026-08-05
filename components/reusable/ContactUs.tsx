import Link from 'next/link'
import { InstagramLogo } from '@phosphor-icons/react/dist/ssr'
import type { Dictionary } from '@/i18n/getDictionary'
import Image from 'next/image'

type ContactInfo = {
  email: string
  socials: { handle: string; href: string }[]
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
        <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
          {dict.heading}
        </h2>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-brand-navy">{dict.emailLabel}</h3>
          <p className="mt-1 text-brand-navy">{contact.email}</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-bold text-brand-navy">{dict.socialLabel}</h3>
          <ul className="mt-2 space-y-1">
            {contact.socials.map((social) => (
              <li key={social.handle}>
                <Link
                  href={social.href}
                  className="flex items-center gap-2 text-brand-navy hover:opacity-70"
                >
                  <InstagramLogo size={18} weight="fill" />
                  <span>{social.handle}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-500">
            <Image src={'/footer.jpeg'} alt={''} fill className='w-full h-full object-cover absolute inset-0 '/>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-500">
            <Image src={'/portrait1.jpeg'} alt={''} fill className='w-full h-full object-cover absolute inset-0 '/>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-500">
            <Image src={'/maluku.jpg'} alt={''} fill className='w-full h-full object-cover absolute inset-0 '/>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-500 sm:aspect-auto sm:h-full" >
          <Image src={'/portrait.jpeg'} alt={''} fill className='w-full h-full object-cover absolute inset-0 '/>
        </div>
      </div>
    </div>
  </section>
)

export default ContactUs
