import { Spinner } from '@/components/ui/primitives'

// Dark so the transparent navbar stays legible while a page loads.
export default function Loading() {
  return (
    <div className="grid min-h-[70vh] place-items-center text-white" style={{ background: 'rgb(var(--footer-bg))' }}>
      <div className="flex flex-col items-center gap-4 text-white/80">
        <Spinner className="h-8 w-8" />
        <p className="text-sm">Preparing the garden…</p>
      </div>
    </div>
  )
}
