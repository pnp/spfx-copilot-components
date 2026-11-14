// The agent never sends URLs: every URL shown comes from the image APIs and must pass these lists.

// Thumbnails are served from thumb.wikimedia.org (since 2026); originals from upload.wikimedia.org.
// No Flickr: its photos (via Openverse) were too often of low quality.
const ALLOWED_IMAGE_HOSTS: string[] = [
  'thumb.wikimedia.org',
  'upload.wikimedia.org',
  'images.metmuseum.org',
  'images-assets.nasa.gov',
  // Portraits of the Microsoft 365 & Power Platform community team (sources/pnp.ts).
  'pnp.github.io'
];
const ALLOWED_LINK_HOSTS: string[] = [
  'commons.wikimedia.org',
  'creativecommons.org',
  'en.wikipedia.org',
  'openverse.org',
  'www.metmuseum.org',
  'images.nasa.gov',
  'pnp.github.io'
];

function hostAllowed(url: string, hosts: string[]): boolean {
  try {
    const u: URL = new URL(url);
    return u.protocol === 'https:' && hosts.indexOf(u.hostname) !== -1;
  } catch {
    return false;
  }
}

export function isAllowedImageUrl(url: string): boolean {
  return hostAllowed(url, ALLOWED_IMAGE_HOSTS);
}

/** Credit links open through the Copilot bridge; only these https hosts are allowed. */
export function isAllowedLinkUrl(url: string): boolean {
  return hostAllowed(url, ALLOWED_LINK_HOSTS) || /^https:\/\/[a-z0-9-]+\.wikipedia\.org\//i.test(url);
}
