import type { Dictionary } from '@/i18n/getDictionary'

const Hero = ({
  dict,
}: {
  dict: Dictionary['marketing']['home']
}) => {
  const { title, subtitle } = dict.hero

  return (
    <section className="relative mx-auto max-w-6xl">
      <div className="relative h-[520px] w-full overflow-hidden bg-neutral-500 sm:h-[600px] lg:h-[680px]">
        <div className="absolute left-4 top-4 sm:left-8 sm:top-6">
          <span className="text-sm font-semibold text-white sm:text-base">
            Indonesia Tanpa Polusi
          </span>
        </div>

        <div className="absolute bottom-8 left-4 right-4 sm:bottom-12 sm:left-auto sm:right-10 sm:max-w-md lg:right-16 lg:max-w-lg">
          <h1 className="text-3xl font-extrabold leading-tight text-brand-yellow sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-white sm:text-base">{subtitle}</p>
        </div>
      </div>
    </section>
  )
}

export default Hero