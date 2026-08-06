import Image from 'next/image'

type AboutRegionProps = {
  dict: { heading: string; body: string[] }
}

const AboutRegion = ({ dict }: AboutRegionProps) => (
  <section id="about" className="bg-background px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:items-start">
      <div className="aspect-square w-full rounded-lg bg-neutral-400 lg:col-span-1 relative overflow-hidden">
        <Image src="/about.jpg" alt="" fill className="w-full h-full object-cover absolute inset-0" />
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-3xl font-extrabold leading-tight text-brand-navy dark:text-foreground sm:text-4xl">
          {dict.heading}
        </h2>
        <div className="mt-6 space-y-4 text-base text-foreground/80 sm:text-lg">
          {dict.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  </section>
)

export default AboutRegion
