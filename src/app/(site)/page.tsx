import { Hero } from '@/components/home/Hero'
import { AmenitiesPreview, BookingCta, ContactStrip, EventPackages, GalleryPreview, Intro, NurserySection, Testimonials } from '@/components/home/sections'
import { getGallery, getSiteContent, getTestimonials } from '@/lib/content'

export default async function HomePage() {
  const [content, gallery, testimonials] = await Promise.all([getSiteContent(), getGallery(), getTestimonials()])
  return (
    <>
      <Hero tagline={content.home.heroTagline} announcement={content.home.announcement} />
      <Intro title={content.home.introTitle} body={content.home.introBody} />
      <AmenitiesPreview items={content.amenities.items} />
      <EventPackages items={content.events.items} />
      <NurserySection title={content.home.nurseryTitle} body={content.home.nurseryBody} />
      <Testimonials items={testimonials} />
      <GalleryPreview items={gallery} />
      <BookingCta whatsapp={content.contact.whatsapp} />
      <ContactStrip contact={content.contact} />
    </>
  )
}
