import type { Dictionary } from '@/i18n/getDictionary'

const AboutUs = ({
  dict,
}: {
  dict: Dictionary['marketing']['home']['about']
}) => (
  <section className="bg-background px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto max-w-4xl">
      <h2 className="text-3xl font-extrabold text-brand-navy dark:text-foreground sm:text-4xl">
        {dict.heading}
      </h2>
      <div className="mt-6 space-y-4 text-base text-foreground/80 sm:text-lg">
        {dict.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  </section>
)

export default AboutUs
