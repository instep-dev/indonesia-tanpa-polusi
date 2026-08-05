import type { Dictionary } from '@/i18n/getDictionary'
import Image from 'next/image'

const AboutUs = ({
  dict,
}: {
  dict: Dictionary['marketing']['home']['about']
}) => (
  <section id="about" className="bg-background px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:items-start">
      <div className="aspect-square w-full rounded-lg bg-neutral-400 lg:col-span-1 h-full relative overflow-hidden">
        <Image src={'/about.jpg'} alt={''} fill className='w-full h-full object-cover absolute inset-0 '/>
      </div>

      <div className="lg:col-span-2">
        <span className="text-sm font-semibold text-foreground/60">{dict.label}</span>
        <h2 className="mt-2 text-3xl font-extrabold leading-tight text-brand-navy dark:text-foreground sm:text-4xl">
          {dict.title}
        </h2>
        <div className="mt-6 space-y-4 text-base text-foreground/80 sm:text-lg">
          {dict.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <a
          href="#stories"
          className="mt-8 inline-block rounded-full bg-brand-yellow px-6 py-2.5 text-sm font-semibold text-brand-navy transition hover:opacity-90"
        >
          {dict.cta}
        </a>
      </div>
    </div>
  </section>
)

export default AboutUs
