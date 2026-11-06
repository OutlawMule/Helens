export type Theme = 'garden' | 'space'
export const THEME_KEY = 'hh-version'
export const isTheme = (v: unknown): v is Theme => v === 'garden' || v === 'space'
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
