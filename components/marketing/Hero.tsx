import type { Dictionary } from '@/i18n/getDictionary'

const Hero = ({
  dict,
}: {
  dict: Dictionary['marketing']['home']
}) => {
  const { title, subtitle } = dict.hero

  return (
    <section className="relative w-full">
      <div className="relative h-[520px] w-full overflow-hidden bg-neutral-500 sm:h-[600px] lg:h-[680px]">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/heros.compressed.mp4" type="video/mp4" />
        </video>
        <div className='bg-black/30 absolute inset-0 z-10'/>

        <div className="absolute inset-0 mx-auto max-w-6xl pointer-events-none z-20">
          <div className="absolute left-0 top-0 sm:left-0 sm:top-6 pointer-events-auto">
            <span className="text-sm font-semibold text-white sm:text-base">
              Indonesia Tanpa Polusi
            </span>
          </div>

          <div className="absolute bottom-12 right-0 pointer-events-auto">
            <h1 className="text-3xl font-extrabold leading-tight text-brand-yellow sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white sm:text-base">{subtitle}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero