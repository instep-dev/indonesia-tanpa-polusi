import type { Dictionary } from '@/i18n/getDictionary'

type StoryCard = { id: string; name: string }

const OurStories = ({
  dict,
  cards,
}: {
  dict: Dictionary['marketing']['home']['ourStories']
  cards: StoryCard[]
}) => (
  <section className="bg-brand-yellow px-6 py-16 sm:px-10 lg:px-20">
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div>
        <h2 className="text-3xl font-extrabold text-brand-navy sm:text-4xl">
          {dict.heading}
        </h2>
        <p className="mt-6 text-base text-brand-navy sm:text-lg">{dict.body}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {cards.map((card, index) => {
          const copy = dict.cards[index]

          return (
            <div key={card.id} className="flex flex-col overflow-hidden rounded-sm">
              <div className="aspect-square w-full bg-neutral-500" />
              <div className="flex flex-1 flex-col justify-between bg-brand-navy p-5">
                <p className="text-sm text-white sm:text-base">&ldquo;{copy.quote}&rdquo;</p>
                <p className="mt-4 font-bold text-brand-yellow">{card.name}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
)

export default OurStories
