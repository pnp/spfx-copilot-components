import { z } from 'zod';

const location = { blockId: z.string().max(80), section: z.number().int().min(0).max(50), column: z.number().int().min(0).max(10) };
export const imageUseSchema = z.object({
  id: z.string().max(128),
  ...location,
  role: z.enum(['banner', 'thumbnail', 'inline', 'image', 'hero', 'quickLinks']),
  url: z.string().max(4096).optional(),
  alt: z.string().max(1024).optional(),
  decorative: z.boolean().optional(),
  state: z.enum(['configured', 'none', 'unknown']),
  bytes: z.number().nonnegative().max(1e12).optional(),
  width: z.number().positive().max(100000).optional(),
  height: z.number().positive().max(100000).optional(),
  metadata: z.enum(['unknown', 'file', 'prepared']).default('unknown')
}).strict();
export const linkUseSchema = z.object({
  id: z.string().max(128),
  ...location,
  url: z.string().max(4096),
  name: z.string().max(1024)
}).strict();
export const mediaSchema = z.object({
  images: z.array(imageUseSchema).max(120),
  links: z.array(linkUseSchema).max(200),
  omitted: z.array(z.string().max(512)).max(100)
}).strict();
export type ImageUse = z.infer<typeof imageUseSchema>;
export type PageMedia = z.infer<typeof mediaSchema>;

/** Resolves a URL and returns it only when it uses HTTPS and carries no user name or password. */
export function httpsUrl(value: string, base?: string): string | undefined {
  try {
    const url = new URL(value, base);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Detects the SharePoint built-in default thumbnail, served from the page's own origin. */
export function isDefaultThumbnail(image: ImageUse, siteUrl: string): boolean {
  if (image.role !== 'thumbnail' || !image.url) return false;
  const safe = httpsUrl(image.url, siteUrl);
  if (!safe) return false;
  try {
    const url = new URL(safe);
    return url.origin === new URL(siteUrl).origin && url.pathname.toLowerCase() === '/_layouts/15/images/sleektemplateimagetile.jpg';
  } catch {
    return false;
  }
}
