'use client'

import type { CSSProperties } from 'react'
import { useTheme } from './ThemeProvider'

// Seeded, so server and client generate identical star tiles.
function starTile(count: number, size: number, seed: number): string {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  let dots = ''
  for (let i = 0; i < count; i++) {
    dots += `<circle cx='${(rnd() * size).toFixed(1)}' cy='${(rnd() * size).toFixed(1)}' r='${(0.5 + rnd() * 1.1).toFixed(2)}' fill='white' fill-opacity='${(0.35 + rnd() * 0.65).toFixed(2)}'/>`
  }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${dots}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
const TILES = [
  { img: starTile(26, 420, 11), size: 420, dur: 260, opacity: 0.55 },
  { img: starTile(18, 640, 29), size: 640, dur: 180, opacity: 0.8 },
  { img: starTile(10, 900, 47), size: 900, dur: 120, opacity: 1 },
]
const vars = (v: Record<string, string>) => v as CSSProperties

/** Fixed, pointer-transparent backdrop behind every page. Only transforms/opacity animate (GPU-friendly). */
export function Atmosphere() {
  const { theme } = useTheme()
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {theme === 'space' ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(60rem 40rem at 82% -8%, rgb(120 60 220 / .38), transparent 60%), radial-gradient(50rem 36rem at -5% 32%, rgb(255 90 200 / .15), transparent 60%), radial-gradient(60rem 40rem at 50% 112%, rgb(60 140 255 / .22), transparent 60%)',
            }}
          />
          {TILES.map((t, i) => (
            <div key={i} className="absolute inset-0" style={{ opacity: t.opacity }}>
              <div className="stars-layer" style={{ backgroundImage: t.img, ...vars({ '--tile': `${t.size}px`, '--dur': `${t.dur}s` }) }} />
            </div>
          ))}
          <div className="shooting-star animate-shoot" />
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60rem 40rem at 92% -10%, rgb(190 154 82 / .14), transparent 60%), radial-gradient(50rem 40rem at -10% 45%, rgb(22 62 46 / .07), transparent 60%)',
          }}
        />
      )}
    </div>
  )
}
