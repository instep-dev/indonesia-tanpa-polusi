import Link from 'next/link'
import { buttonVariants } from '@/components/reusable/Button'

type NotFoundSectionProps = {
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

// Rendered inside the localized layout (navbar + footer). There's no hero on
// this page, so the top padding clears the fixed navbar.
const NotFoundSection = ({ title, body, ctaLabel, ctaHref }: NotFoundSectionProps) => (
  <section className="bg-background px-6 pt-40 pb-28 sm:px-10 lg:px-20">
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-tilt-warp text-7xl text-brand-yellow sm:text-8xl">404</p>
      <h1 className="mt-4 text-3xl font-tilt-warp text-brand-navy sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base text-foreground/70">{body}</p>
      <Link href={ctaHref} className={`${buttonVariants({ variant: 'yellow' })} mt-8 inline-block`}>
        {ctaLabel}
      </Link>
    </div>
  </section>
)

export default NotFoundSection
