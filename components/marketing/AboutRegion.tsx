import Image from 'next/image'

type AboutRegionProps = {
  dict: { heading: string; body: string[] }
}

const AboutRegion = ({ dict }: AboutRegionProps) => (
  <section id="about" className="bg-background px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:items-start">
      <div className="rounded-sm border-1 shadow-md/20 lg:col-span-1">
        <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-neutral-400 h-full">
          <Image src="/about.jpg" alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="lg:col-span-2">
        <h2 className="text-3xl font-tilt-warp leading-tight text-brand-navy dark:text-foreground sm:text-4xl">
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
