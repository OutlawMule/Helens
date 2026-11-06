import { MessageCircle } from 'lucide-react'

export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Helens Haven on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-xl transition-transform hover:scale-105"
      style={{ background: '#1faa59' }}
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  )
}
