import type { Dictionary } from '@/i18n/getDictionary'

const Hero = ({
  dict,
}: {
  dict: Dictionary['marketing']['home']
}) => {
  const { title, subtitle, cta } = dict.hero

  return (
    <section className="relative w-full">
      <div id="hero-viewport" className="relative w-full overflow-hidden bg-neutral-500 h-screen">
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

        <div className="absolute inset-0 mx-auto max-w-6xl px-6 pointer-events-none sm:px-10 lg:px-20 z-20">
          <div className="absolute bottom-12 left-0 pointer-events-auto sm:bottom-16">
            <h1 className="text-3xl max-w-2xl font-medium leading-tight text-white sm:text-4xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white sm:text-base">{subtitle}</p>
            <a
              href="#about"
              className="mt-6 inline-block rounded-full bg-brand-yellow px-6 py-2.5 text-sm font-semibold text-brand-navy transition hover:opacity-90"
            >
              {cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero