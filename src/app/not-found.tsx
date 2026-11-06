import Link from 'next/link'

export default function NotFound() {
  return (
    <div data-theme="garden" className="grid min-h-screen place-items-center bg-bg px-6 text-center text-ink">
      <div>
        <p className="h-display text-7xl text-brand">404</p>
        <h1 className="h-display mt-4 text-3xl">This path leads nowhere in the garden</h1>
        <p className="lead mx-auto mt-4">The page you are looking for has moved or never existed. Let us take you back to somewhere familiar.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back to the homepage</Link>
          <Link href="/bookings" className="btn btn-ghost">Request a booking</Link>
        </div>
      </div>
    </div>
  )
}
