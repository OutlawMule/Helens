'use client'

import { ButtonLink } from '@/components/ui/primitives'

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-6 py-32 text-center text-white" style={{ background: 'rgb(var(--footer-bg))' }}>
      <div>
        <h1 className="h-display text-4xl sm:text-5xl">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-white/80">We hit an unexpected problem loading this page. You can try again, or contact us directly.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-gold" onClick={() => reset()}>Try again</button>
          <ButtonLink href="/contact" variant="light">Contact us</ButtonLink>
        </div>
      </div>
    </div>
  )
}
