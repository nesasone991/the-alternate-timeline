/**
 * Brand constants. Channel links are left empty until the owner supplies the
 * real URLs; the footer only renders links that are set, so nothing points to
 * a guessed address.
 */
export const BRAND = {
  productName: 'The Alternate Timeline',
  tagline: 'History happened once. What if it didn’t?',
  byline: 'An interactive historical experience by Tales of the Past.',
  mediaPartner: 'Tales of the Past',
  channels: [
    { id: 'youtube', label: 'Tales of the Past on YouTube', url: '' },
    { id: 'tiktok', label: 'Tales of the Past on TikTok', url: '' },
  ],
} as const;

export function configuredChannels() {
  return BRAND.channels.filter((channel) => channel.url.startsWith('https://'));
}
