'use client'

import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import { Scene } from '@/components/theme/Scene'
import { useTheme } from '@/components/theme/ThemeProvider'
import { ButtonLink } from '@/components/ui/primitives'
import { BUSINESS } from '@/lib/business'
import { AMENITY_SPECS } from '@/lib/constants'
import { EASE } from '@/lib/theme'

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.13, delayChildren: 0.2 } } }
const rise: Variants = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } } }

const FACTS = ['40m × 40m open arena', 'Swimming pool', 'Fire pit lounge', 'Pub & restaurant', 'Flower nursery']
const SECTORS = [
  { name: 'Open Arena', spec: AMENITY_SPECS['open-arena'][0] },
  { name: 'Swimming Pool', spec: AMENITY_SPECS['swimming-pool'][0] },
  { name: 'Fire Pit & Lounge', spec: 'Central fireplace' },
  { name: 'Pub & Restaurant', spec: 'Garden dining' },
  { name: 'Flower Nursery', spec: 'Plants & gardening' },
]

export function Hero({ tagline, announcement }: { tagline: string; announcement?: string }) {
  const { theme } = useTheme()
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const shift = useTransform(scrollY, [0, 700], [0, reduce ? 0 : 110])
  const space = theme === 'space'

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden text-white">
      <motion.div className="absolute inset-x-0 -top-10 -z-10 h-[calc(100%+6rem)]" style={{ y: shift }}>
        <Scene kind="hero" align="xMidYMax" />
        {!space && Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="pollen animate-rise" style={{ left: `${(i * 7 + 4) % 96}%`, width: 3 + (i % 3) * 2, height: 3 + (i % 3) * 2, animationDelay: `${i * 1.1}s`, animationDuration: `${12 + (i % 5) * 3}s` }} />
        ))}
      </motion.div>
      <div className="absolute inset-0 -z-10" style={{ background: 'var(--hero-overlay)' }} />

      <div className="container-x pb-14 pt-40 sm:pb-20">
        {space ? (
          <motion.div className="grid items-end gap-12 lg:grid-cols-[1.25fr_0.75fr]" variants={stagger} initial="hidden" animate="show">
            <div>
              <motion.p variants={rise} className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-sm text-brand backdrop-blur">
                <span className="h-2 w-2 animate-glow rounded-full bg-brand" aria-hidden />
                Space Garden edition
              </motion.p>
              <motion.h1 variants={rise} className="h-display mt-6 text-5xl sm:text-7xl lg:text-8xl">
                <span className="bg-gradient-to-r from-white via-white to-brand bg-clip-text text-transparent">A botanical sanctuary among the stars</span>
              </motion.h1>
              <motion.p variants={rise} className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">
                Helens Haven reimagined as a luxury garden resort on another planet. The same arena, pool, fire pit lounge, restaurant and nursery, with the same real welcome in Lusaka West.
              </motion.p>
              <motion.div variants={rise} className="mt-9 flex flex-wrap gap-4">
                <ButtonLink href="/bookings">Request a booking</ButtonLink>
                <ButtonLink href="/venue" variant="light">Explore the venue</ButtonLink>
              </motion.div>
            </div>
            <motion.aside variants={rise} className="holo card hidden overflow-hidden p-6 lg:block" aria-label="Garden sectors">
              <div className="absolute inset-x-0 top-0 h-24 animate-scan bg-gradient-to-b from-brand/0 via-brand/10 to-brand/0" aria-hidden />
              <p className="text-sm text-brand">Garden sectors</p>
              <ul className="mt-4 divide-y divide-white/10">
                {SECTORS.map((s) => (
                  <li key={s.name} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgb(94_255_168)]" aria-hidden />{s.name}</span>
                    <span className="text-white/60">{s.spec}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs text-white/50">Lusaka West · {BUSINESS.lat.toFixed(4)}, {BUSINESS.lng.toFixed(4)}</p>
            </motion.aside>
          </motion.div>
        ) : (
          <motion.div className="mx-auto max-w-4xl text-center" variants={stagger} initial="hidden" animate="show">
            {announcement && <motion.p variants={rise} className="mx-auto mb-6 inline-block rounded-full bg-accent/90 px-5 py-1.5 text-sm font-medium text-on-accent">{announcement}</motion.p>}
            <motion.p variants={rise} className="mb-5 inline-flex items-center gap-4 text-base text-accent">
              <span className="h-px w-10 bg-accent/70" aria-hidden />Lusaka West, Zambia<span className="h-px w-10 bg-accent/70" aria-hidden />
            </motion.p>
            <motion.h1 variants={rise} className="h-display text-6xl sm:text-8xl lg:text-9xl">Helens Haven</motion.h1>
            <motion.p variants={rise} className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/85 sm:text-xl">{tagline}</motion.p>
            <motion.div variants={rise} className="mt-9 flex flex-wrap justify-center gap-4">
              <ButtonLink href="/bookings" variant="gold">Request a booking</ButtonLink>
              <ButtonLink href="/amenities" variant="light">Explore the gardens</ButtonLink>
            </motion.div>
          </motion.div>
        )}

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-14 flex flex-wrap justify-center gap-x-0 gap-y-3 text-sm text-white/80 sm:mt-20 lg:justify-start"
          aria-label="Venue highlights"
        >
          {FACTS.map((f, i) => (
            <li key={f} className={i === 0 ? 'pr-5' : 'border-l border-white/25 px-5'}>{f}</li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
