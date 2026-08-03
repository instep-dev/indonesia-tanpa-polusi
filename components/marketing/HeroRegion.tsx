import type { Dictionary, Locale } from '@/i18n/getDictionary'

type RegionKey = 'sulawesi' | 'malukuUtara' | 'kalimantanUtara'

type HeroRegionProps = {
  dict: Dictionary['marketing']['home']['regions'][RegionKey]
}

const HeroRegion = ({ dict }: HeroRegionProps) => (
  <section className="relative w-full">
    <div className="relative h-[520px] w-full overflow-hidden bg-neutral-500 sm:h-[600px] lg:h-[680px]" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1662808782878-941ea16adbdc?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)', backgroundSize: 'cover', backgroundPosition: "center", }}>
      <div className='w-full h-1/2 absolute bottom-0 left-0 right-0 bg-[#33477d]/70'/>
      <div className="absolute inset-0 mx-auto max-w-6xl pointer-events-none">
        <div className="absolute left-0 top-6 sm:top-8 pointer-events-auto">
          <span className="text-sm font-semibold text-white sm:text-base">
            Indonesia Tanpa Polusi
          </span>
        </div>

        <div className="absolute bottom-12 left-0 right-0 sm:bottom-16 pointer-events-auto z-30">
          <h1 className="text-3xl font-extrabold leading-tight text-brand-yellow sm:text-4xl lg:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-white sm:text-base">{dict.hero.subtitle}</p>
        </div>
      </div>
    </div>
  </section>
)

export default HeroRegion
