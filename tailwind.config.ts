import type { Config } from 'tailwindcss'

// Colours are CSS variables (RGB triplets) so every utility re-skins when the visitor
// switches between the Original Garden and Space Garden versions.
const token = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // Component classes from globals.css that are only ever composed dynamically.
  safelist: ['btn-primary', 'btn-gold', 'btn-ghost', 'btn-light', 'btn-danger'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        'bg-alt': token('bg-alt'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        brand: token('brand'),
        'brand-soft': token('brand-soft'),
        'on-brand': token('on-brand'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
        'on-accent': token('on-accent'),
        azure: token('blue'),
        danger: token('danger'),
        ok: token('ok'),
        warn: token('warn'),
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        sway: { '0%,100%': { transform: 'rotate(-2.2deg)' }, '50%': { transform: 'rotate(2.2deg)' } },
        twinkle: { '0%,100%': { opacity: '0.25' }, '50%': { opacity: '1' } },
        rise: {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '15%': { opacity: '0.9' },
          '100%': { transform: 'translateY(-70vh) translateX(30px)', opacity: '0' },
        },
        glow: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        shoot: {
          '0%': { transform: 'translate3d(0,0,0) rotate(28deg)', opacity: '0' },
          '4%': { opacity: '1' },
          '14%': { transform: 'translate3d(420px,230px,0) rotate(28deg)', opacity: '0' },
          '100%': { transform: 'translate3d(420px,230px,0) rotate(28deg)', opacity: '0' },
        },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        float: 'float 9s ease-in-out infinite',
        'float-slow': 'float 14s ease-in-out infinite',
        sway: 'sway 6s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        rise: 'rise 14s linear infinite',
        glow: 'glow 3.6s ease-in-out infinite',
        'spin-slow': 'spinSlow 60s linear infinite',
        shoot: 'shoot 16s ease-out infinite',
        scan: 'scan 7s linear infinite',
      },
    },
  },
  plugins: [],
}

export default config
