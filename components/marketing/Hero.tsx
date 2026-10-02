import type { Dictionary } from '@/i18n/getDictionary'

// Let the browser sniff the format unless the extension tells us for sure — a
// wrong `type` makes browsers skip a perfectly playable source.
const videoMimeType = (src: string): string | undefined => {
  const path = src.split('?')[0].toLowerCase()
  if (path.endsWith('.mp4')) return 'video/mp4'
  if (path.endsWith('.webm')) return 'video/webm'
  return undefined
}

const Hero = ({
  dict,
  videoSrc,
  ctaHref,
}: {
  dict: Dictionary['marketing']['home']
  videoSrc: string
  ctaHref: string
}) => {
  const { title, subtitle, cta } = dict.hero

  return (
    <section className="relative w-full">
      <div id="hero-viewport" className="relative w-full overflow-hidden bg-neutral-500 h-screen">
        <video
          key={videoSrc}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={videoSrc} type={videoMimeType(videoSrc)} />
        </video>
        <div className='bg-black/30 absolute inset-0 z-10' />

        <div className="absolute inset-0 mx-auto max-w-6xl pointer-events-none z-20">
          <div className="absolute bottom-12 left-0 right-0 px-6 pointer-events-auto sm:bottom-16 sm:px-10 lg:px-20 xl:px-0">
            <h1 className="text-3xl max-w-2xl font-tilt-warp leading-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white sm:text-lg">{subtitle}</p>
            <a
              href={ctaHref}
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