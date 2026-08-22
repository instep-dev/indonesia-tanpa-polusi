import type { Dictionary } from '@/i18n/getDictionary'
import Image from 'next/image'

type RegionKey = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

type HeroRegionProps = {
  dict: Dictionary['marketing']['home']['regions'][RegionKey]
  image: string
}

const HeroRegion = ({ dict, image }: HeroRegionProps) => (
  <section className="relative w-full">
    <div id="hero-viewport" className="relative w-full overflow-hidden bg-neutral-500 h-screen" >
      <Image src={image} alt='' fill className='absolute inset-0 w-full h-full object-cover'/>
      <div className='w-full h-1/2 absolute bottom-0 left-0 right-0 bg-[#33477d]/70 z-10'/>
      <div className="absolute inset-0 mx-auto max-w-6xl pointer-events-none z-20">
        <div className="absolute bottom-12 left-0 right-0 px-6 sm:bottom-16 sm:px-10 lg:px-20 xl:px-0 pointer-events-auto z-30">
          <h1 className="text-3xl max-w-2xl font-tilt-warp leading-tight text-brand-yellow sm:text-5xl lg:text-6xl">
            {dict.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white sm:text-lg">{dict.hero.subtitle}</p>
        </div>
      </div>
    </div>
  </section>
)

export default HeroRegion
