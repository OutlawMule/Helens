'use client'

import { useId } from 'react'
import { useTheme } from './ThemeProvider'
import type { SceneKind } from '@/lib/constants'
import { cn } from '@/lib/utils'

/**
 * Illustrated PLACEHOLDER artwork. There are no real photographs of the venue in this project, so these vector
 * scenes stand in for them and are always labelled as placeholders. Palette comes from the --sc-* theme tokens,
 * so the same drawing re-skins as a sunlit garden or a floating garden among the stars.
 */
const c = (name: string, a = 1) => `rgb(var(--sc-${name}) / ${a})`

const STARS: [number, number, number, number][] = (() => {
  let s = 7
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: 64 }, () => [Math.round(rnd() * 800), Math.round(rnd() * 330), +(0.6 + rnd() * 1.3).toFixed(1), +(0.35 + rnd() * 0.65).toFixed(2)])
})()

function Sky({ id, space }: { id: string; space: boolean }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c('sky-1')} />
          <stop offset="1" stopColor={c('sky-2')} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor={c('sun', 0.95)} />
          <stop offset="1" stopColor={c('sun', 0)} />
        </radialGradient>
        <radialGradient id={`${id}-pink`}>
          <stop offset="0" stopColor="rgb(255 90 200 / .5)" />
          <stop offset="1" stopColor="rgb(255 90 200 / 0)" />
        </radialGradient>
        <radialGradient id={`${id}-blue`}>
          <stop offset="0" stopColor="rgb(90 120 255 / .45)" />
          <stop offset="1" stopColor="rgb(90 120 255 / 0)" />
        </radialGradient>
        <radialGradient id={`${id}-planet`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="rgb(160 220 255)" />
          <stop offset="0.55" stopColor="rgb(110 90 220)" />
          <stop offset="1" stopColor="rgb(40 20 100)" />
        </radialGradient>
        <radialGradient id={`${id}-fire`}>
          <stop offset="0" stopColor={c('fire', 0.55)} />
          <stop offset="1" stopColor={c('fire', 0)} />
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#${id}-sky)`} />
      {space ? (
        <>
          <ellipse cx="160" cy="150" rx="300" ry="150" fill={`url(#${id}-pink)`} />
          <ellipse cx="640" cy="250" rx="320" ry="170" fill={`url(#${id}-blue)`} />
          {STARS.map(([x, y, r, o], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={o} className={i % 4 === 0 ? 'animate-twinkle' : undefined} style={i % 4 === 0 ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined} />
          ))}
          <ellipse cx="610" cy="165" rx="122" ry="20" fill="none" stroke="rgb(233 201 122 / .75)" strokeWidth="3" transform="rotate(-16 610 165)" />
          <circle cx="610" cy="165" r="64" fill={`url(#${id}-planet)`} />
        </>
      ) : (
        <>
          <circle cx="590" cy="190" r="200" fill={`url(#${id}-glow)`} />
          <circle cx="590" cy="190" r="46" fill={c('sun', 0.92)} />
        </>
      )}
    </>
  )
}

function Ground({ space }: { space: boolean }) {
  if (!space) {
    return (
      <>
        <path d="M0 360 C120 320 220 340 320 352 S560 330 800 350 V600 H0Z" fill={c('far')} />
        <path d="M0 402 C140 362 260 392 400 388 S650 362 800 394 V600 H0Z" fill={c('mid')} />
        <path d="M0 452 C180 424 330 456 480 442 S700 432 800 450 V600 H0Z" fill={c('near')} />
      </>
    )
  }
  return (
    <>
      <g className="animate-float-slow float-origin">
        <path d="M40 372 Q120 358 200 372 L180 392 Q150 430 120 438 Q90 428 62 392Z" fill={c('far')} />
        <ellipse cx="120" cy="370" rx="82" ry="9" fill={c('mid')} />
        <circle cx="96" cy="356" r="5" fill={c('a')} /><circle cx="130" cy="352" r="4" fill={c('b')} />
      </g>
      <g className="animate-float float-origin" style={{ animationDelay: '-4s' }}>
        <path d="M640 330 Q700 320 760 330 L748 346 Q724 380 700 386 Q676 378 652 346Z" fill={c('far')} />
        <ellipse cx="700" cy="329" rx="60" ry="7" fill={c('mid')} />
        <circle cx="684" cy="318" r="4" fill={c('c')} /><circle cx="716" cy="316" r="5" fill={c('a')} />
      </g>
      <path d="M60 452 Q400 414 740 452 L664 488 Q612 592 400 602 Q188 592 136 488Z" fill={c('near')} />
      <ellipse cx="400" cy="450" rx="340" ry="26" fill={c('mid')} />
    </>
  )
}

const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-5" y="-30" width="10" height="36" rx="4" fill={c('dark')} />
    <circle cx="0" cy="-62" r="36" fill={c('dark')} />
    <circle cx="-24" cy="-42" r="24" fill={c('near')} />
    <circle cx="25" cy="-46" r="26" fill={c('near')} />
  </g>
)
const Bloom = ({ x, y, k }: { x: number; y: number; k: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x="-1" y="0" width="2" height="22" fill={c('dark')} />
    <circle r="13" fill={c(k % 2 ? 'a' : 'b', 0.2)} />
    <circle r="6.5" fill={c(k % 2 ? 'a' : 'b')} />
    <circle r="2.4" fill={c('sun')} />
  </g>
)
const Row = ({ x, y, n, gap = 24 }: { x: number; y: number; n: number; gap?: number }) => (
  <>{Array.from({ length: n }, (_, i) => <Bloom key={i} x={x + i * gap} y={y - (i % 3) * 7} k={i} />)}</>
)
const Tent = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <polygon points="0,56 58,4 116,56" fill={c('c')} />
    <rect x="0" y="56" width="116" height="46" fill={c('c', 0.9)} />
    <rect x="42" y="70" width="32" height="32" fill={c('far')} />
  </g>
)
const Chairs = ({ x, y, n, gap = 20 }: { x: number; y: number; n: number; gap?: number }) => (
  <>{Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * gap} y={y} width="12" height="14" rx="3" fill={c('c', 0.85)} />)}</>
)
const Bulbs = ({ d, n }: { d: string; n: number }) => (
  <>
    <path d={d} stroke={c('dark')} strokeWidth="1.5" fill="none" />
    {Array.from({ length: n }, (_, i) => <circle key={i} r="4" cx={90 + i * (620 / (n - 1))} cy={420 + Math.sin((i / (n - 1)) * Math.PI) * 38} fill={c('sun')} />)}
  </>
)

function Motif({ kind, id, space }: { kind: SceneKind; id: string; space: boolean }) {
  switch (kind) {
    case 'hero':
      return space ? (
        <>
          <g className="animate-float float-origin" style={{ animationDelay: '-2s' }}>
            <path d="M300 440 A100 100 0 0 1 500 440Z" fill={c('c', 0.1)} stroke={c('b', 0.85)} strokeWidth="2" />
            <path d="M400 340 V440 M340 372 Q400 350 460 372" stroke={c('b', 0.5)} fill="none" />
            <rect x="394" y="400" width="12" height="42" fill={c('dark')} /><circle cx="400" cy="392" r="26" fill={c('a', 0.9)} /><circle cx="400" cy="392" r="44" fill={c('a', 0.16)} />
          </g>
          <Row x={150} y={500} n={20} gap={25} />
        </>
      ) : (
        <>
          <Tree x={110} y={470} s={2.1} /><Tree x={706} y={462} s={1.8} /><Tree x={560} y={456} s={1} />
          <g className="animate-sway sway-origin"><Row x={170} y={540} n={18} gap={24} /></g>
          <g className="animate-sway sway-origin" style={{ animationDelay: '-2s' }}><Row x={190} y={566} n={17} gap={24} /></g>
        </>
      )
    case 'arena':
      return (
        <>
          <polygon points="150,466 650,466 770,572 30,572" fill={c('mid')} />
          <polygon points="215,480 585,480 680,556 120,556" fill={c('far', 0.75)} stroke={c('c', 0.55)} strokeWidth="2" />
          <Tent x={640} y={394} /><Tent x={44} y={410} s={0.8} />
          <Bulbs d="M110 420 Q400 500 690 420" n={9} />
        </>
      )
    case 'pool':
      return (
        <>
          <polygon points="120,468 680,468 750,568 50,568" fill={c('c', 0.85)} />
          <polygon points="152,482 648,482 708,552 92,552" fill={c('water')} />
          <path d="M190 506 q22 -9 44 0 t44 0 t44 0 M400 532 q22 -9 44 0 t44 0 t44 0" stroke={c('c', 0.75)} strokeWidth="2.5" fill="none" />
          <rect x="62" y="526" width="38" height="12" rx="3" fill={c('c')} /><rect x="704" y="526" width="38" height="12" rx="3" fill={c('c')} />
          <g transform="translate(718 424)"><rect x="-2" y="0" width="4" height="50" fill={c('dark')} /><path d="M-48 2 Q0 -34 48 2Z" fill={c('a')} /></g>
          <Tree x={92} y={470} s={0.9} />
        </>
      )
    case 'fire':
      return (
        <>
          <rect width="800" height="600" fill={c('dark', 0.4)} />
          <circle cx="400" cy="486" r="150" fill={`url(#${id}-fire)`} />
          <ellipse cx="400" cy="522" rx="112" ry="26" fill={c('dark', 0.85)} />
          {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx={400 + Math.cos((i / 12) * 6.283) * 96} cy={522 + Math.sin((i / 12) * 6.283) * 20} rx="12" ry="8" fill={c('far')} />)}
          <path d="M400 440 C366 482 370 510 400 518 C430 510 434 482 400 440Z" fill={c('fire')} />
          <path d="M400 472 C386 494 388 508 400 512 C412 508 414 494 400 472Z" fill={c('sun')} />
          <rect x="104" y="500" width="64" height="16" rx="6" fill={c('c', 0.5)} /><rect x="632" y="500" width="64" height="16" rx="6" fill={c('c', 0.5)} />
          <Tree x={64} y={474} s={1.2} /><Tree x={744} y={470} s={1.1} />
        </>
      )
    case 'dining':
      return (
        <>
          <Bulbs d="M90 420 Q400 496 710 420" n={11} />
          {[170, 400, 630].map((x, i) => (
            <g key={x} transform={`translate(${x} ${512 + (i === 1 ? 14 : 0)})`}>
              <ellipse rx="64" ry="16" fill={c('c')} /><rect x="-3" y="0" width="6" height="26" fill={c('dark')} />
              <circle cx="-82" cy="4" r="9" fill={c('b')} /><circle cx="82" cy="4" r="9" fill={c('b')} /><circle cy="-8" r="5" fill={c('a')} />
            </g>
          ))}
          <Tree x={60} y={470} s={1} /><Tree x={750} y={470} s={1} />
        </>
      )
    case 'nursery':
      return (
        <>
          <g transform="translate(468 384)">
            <polygon points="0,78 0,30 78,0 156,30 156,78" fill={c('c', 0.3)} stroke={c('c', 0.85)} strokeWidth="2.5" />
            <path d="M78 0 V78 M39 15 V78 M117 15 V78 M0 54 H156" stroke={c('c', 0.6)} strokeWidth="1.5" />
          </g>
          {[500, 540].map((y, r) => (
            <g key={y}>
              {Array.from({ length: 11 }, (_, i) => (
                <g key={i} transform={`translate(${96 + i * 54 - r * 20} ${y})`}>
                  <polygon points="-13,0 13,0 9,20 -9,20" fill={c('fire', 0.9)} />
                  <circle cy="-8" r="11" fill={c('near')} /><circle cy="-13" r="6" fill={c((i + r) % 2 ? 'a' : 'b')} />
                </g>
              ))}
            </g>
          ))}
        </>
      )
    case 'wedding':
      return (
        <>
          <polygon points="382,462 418,462 470,574 330,574" fill={c('c', 0.8)} />
          <g transform="translate(400 296)">
            <path d="M-84 168 V66 A84 84 0 0 1 84 66 V168" stroke={c('c')} strokeWidth="8" fill="none" />
            {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={-84 + (i * 168) / 8} cy={66 - Math.sin((i / 8) * Math.PI) * 84} r={9 - (i % 3)} fill={c(i % 2 ? 'a' : 'b')} />)}
          </g>
          <Chairs x={190} y={500} n={8} gap={22} /><Chairs x={474} y={500} n={8} gap={22} /><Chairs x={170} y={528} n={9} gap={24} /><Chairs x={460} y={528} n={9} gap={24} />
        </>
      )
    case 'concert':
      return (
        <>
          <polygon points="300,434 190,250 360,250" fill={c('sun', 0.2)} /><polygon points="400,434 400,250 470,250" fill={c('a', 0.18)} /><polygon points="500,434 610,250 440,250" fill={c('b', 0.2)} />
          <rect x="230" y="432" width="340" height="68" fill={c('dark')} />
          <path d="M230 432 V404 H570 V432 M230 404 L400 380 L570 404" stroke={c('c', 0.8)} strokeWidth="3" fill="none" />
          {Array.from({ length: 5 }, (_, i) => <circle key={i} cx={270 + i * 65} cy="418" r="6" fill={c(i % 2 ? 'a' : 'sun')} />)}
          {Array.from({ length: 22 }, (_, i) => <circle key={i} cx={70 + i * 31} cy={548 + (i % 3) * 8} r="12" fill={c('dark')} />)}
        </>
      )
    case 'celebration':
      return (
        <>
          <path d="M40 410 Q400 490 760 410" stroke={c('dark')} strokeWidth="1.5" fill="none" />
          {Array.from({ length: 14 }, (_, i) => {
            const t = i / 13
            return <polygon key={i} points={`${50 + t * 700 - 14},${414 + Math.sin(t * Math.PI) * 38} ${50 + t * 700 + 14},${414 + Math.sin(t * Math.PI) * 38} ${50 + t * 700},${440 + Math.sin(t * Math.PI) * 38}`} fill={c(['a', 'b', 'c'][i % 3])} />
          })}
          {[170, 250, 330, 470, 550, 630].map((x, i) => (
            <g key={x}><line x1={x} y1={528 - (i % 2) * 18} x2={x} y2={560} stroke={c('c', 0.6)} /><ellipse cx={x} cy={500 - (i % 2) * 18} rx="22" ry="27" fill={c(['a', 'b', 'c'][i % 3])} /></g>
          ))}
          <ellipse cx="400" cy="548" rx="70" ry="14" fill={c('c')} />
        </>
      )
    case 'corporate':
      return (
        <>
          <Tent x={80} y={392} s={1.5} />
          <rect x="560" y="430" width="150" height="86" rx="4" fill={c('dark')} /><rect x="568" y="438" width="134" height="70" fill={c('sun', 0.55)} />
          <Chairs x={250} y={510} n={10} gap={26} /><Chairs x={250} y={538} n={10} gap={26} />
          <rect x="612" y="520" width="26" height="40" fill={c('c', 0.9)} />
        </>
      )
    default:
      return (
        <>
          <Tree x={150} y={474} s={1.3} /><Tree x={690} y={468} s={1.1} /><Tree x={600} y={482} s={0.75} />
          <Row x={230} y={526} n={14} />
        </>
      )
  }
}

export function Scene({ kind, className, align = 'xMidYMid' }: { kind: SceneKind; className?: string; align?: 'xMidYMid' | 'xMidYMax' }) {
  const { theme } = useTheme()
  const space = theme === 'space'
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 800 600" preserveAspectRatio={`${align} slice`} className={cn('absolute inset-0 h-full w-full', className)} aria-hidden focusable="false">
      <Sky id={id} space={space} />
      <Ground space={space} />
      <Motif kind={kind} id={id} space={space} />
    </svg>
  )
}

/** Every piece of placeholder artwork carries this label so it can never pass as a real photograph. */
export function PlaceholderTag({ className }: { className?: string }) {
  return <span className={cn('absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur', className)}>Placeholder artwork, not a real photo</span>
}

export function SceneFrame({ kind, className, tag = true, label }: { kind: SceneKind; className?: string; tag?: boolean; label?: string }) {
  return (
    <div className={cn('frame aspect-[4/3] w-full', className)} role="img" aria-label={label ?? 'Placeholder illustration'}>
      <Scene kind={kind} />
      {tag && <PlaceholderTag />}
    </div>
  )
}
