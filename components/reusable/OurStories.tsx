import type { StoryItem } from '@/libs/contentMerge'
import Image from 'next/image'

const OurStories = ({
  dict,
  cards,
}: {
  dict: { heading: string; body: string }
  cards: StoryItem[]
}) => (
  <section id="stories" className="bg-brand-yellow px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div>
        <h2 className="text-3xl font-tilt-warp text-brand-navy sm:text-4xl">
          {dict.heading}
        </h2>
        <p className="mt-6 text-base text-brand-navy sm:text-lg">{dict.body}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {cards.map((card) => (
          <div key={card.id} className="flex flex-col overflow-hidden rounded-sm border-1 border-slate-200 shadow-md/20">
            <div className="aspect-square w-full bg-neutral-500 relative">
              {card.imageUrl && (
                <Image src={card.imageUrl} alt={''} fill className='w-full h-full object-cover absolute inset-0 ' />
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between bg-brand-navy p-5 relative z-30">
              <p className="text-sm text-white sm:text-base">&ldquo;{card.quote}&rdquo;</p>
              <p className="mt-4 font-bold text-brand-yellow">{card.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
)

export default OurStories
