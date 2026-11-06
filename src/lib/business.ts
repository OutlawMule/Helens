/**
 * Verified business details supplied by the owner. These are the defaults used across the site;
 * the admin panel can override them (stored in website_content → "contact").
 * Do not add addresses, prices or policies that have not been verified.
 */
export const BUSINESS = {
  name: 'Helens Haven',
  addressLines: ['Farm 1956/81A Off Mungwi Road', 'Lusaka West, Lusaka, Zambia'],
  phone: '+260 971 664 049',
  whatsapp: 'https://wa.me/260971664049',
  email: 'helenshaven0@gmail.com',
  mapsUrl: "https://maps.google.com/maps?q=Helen's%2BHaven%2BChilanga%2BDistrict%2C%2BZM&sll=-15.37365257,28.1331204",
  // Coordinates are taken from the "sll" parameter of the supplied Google Maps link.
  lat: -15.37365257,
  lng: 28.1331204,
} as const

export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${BUSINESS.lat},${BUSINESS.lng}`
export const mapsEmbedUrl = (mapsUrl: string) => `${mapsUrl}${mapsUrl.includes('?') ? '&' : '?'}output=embed`
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
