import type { Dictionary } from '@/i18n/getDictionary'

type HeroLatestNewsProps = {
  dict: Dictionary['marketing']['latestNews']
}

const HeroLatestNews = ({ dict }: HeroLatestNewsProps) => (
  <section className="relative w-full">
    <div id="hero-viewport" className="relative h-[520px] w-full overflow-hidden bg-neutral-500 sm:h-[600px] lg:h-[680px]" style={{ backgroundImage: 'url(/aksi-pltu-captive.jpg)', backgroundSize: 'cover', backgroundPosition: "center", }}>
      <div className='w-full h-[40%] absolute bottom-0 left-0 right-0 bg-[#33477d]/70' />
      <div className="absolute inset-0 mx-auto max-w-6xl pointer-events-none">
        <div className="absolute bottom-12 left-0 right-0 px-6 sm:bottom-16 sm:px-10 lg:px-20 xl:px-0 pointer-events-auto z-30">
          <h1 className="text-3xl font-tilt-warp leading-tight text-brand-yellow sm:text-4xl lg:text-5xl">
            Aksi Tuntutan di Monas
          </h1>
          <p className="mt-4 max-w-4xl text-sm text-white sm:text-2xl">Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati mollitia recusandae corporis, animi nesciunt accusantium. Vel, praesentium ipsam itaque ipsum nam enim. Maxime, natus suscipit!</p>
        </div>
      </div>
    </div>
  </section>
)

export default HeroLatestNews
