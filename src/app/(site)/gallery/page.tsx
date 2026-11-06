import type { Metadata } from 'next'
import { GalleryView } from '@/components/gallery/GalleryView'
import { PageHero, Section } from '@/components/ui/primitives'
import { getGallery } from '@/lib/content'

export const metadata: Metadata = { title: 'Gallery' }

export default async function GalleryPage() {
  const items = await getGallery()
  return (
    <>
      <PageHero title="Gallery" intro="Weddings, celebrations, the arena, the pool, the fire pit and the nursery." scene="wedding" />
      <Section className="!pt-14">
        <GalleryView items={items} />
      </Section>
    </>
  )
}
