// Helpers every source shares: JSON from a public API, query strings, and HTML metadata as text.

import { ImageSearchError } from './types';

/** JSON from a public API; failures become ImageSearchErrors (network covers CSP and CORS). */
export function getJson(url: string, name: string): Promise<unknown> {
  // No custom headers: they would force a CORS preflight; the browser's User-Agent is sent anyway.
  return fetch(url).then(
    (res: Response) => {
      if (!res.ok) {
        throw new ImageSearchError(`http-${res.status}`, `${name} answered ${res.status}`);
      }
      return res.json().catch(() => {
        throw new ImageSearchError('bad-response', `${name} answer is not JSON`);
      });
    },
    (error: unknown) => {
      throw new ImageSearchError('network', error instanceof Error ? error.message : String(error));
    }
  );
}

export function query(params: Record<string, string>): string {
  return Object.keys(params)
    .map((k: string) => `${k}=${encodeURIComponent(params[k])}`)
    .join('&');
}

/** extmetadata values are HTML snippets; this keeps the text only (DOMParser runs no scripts). */
export function htmlToText(html: string | undefined): string | undefined {
  if (!html) {
    return undefined;
  }
  const body: HTMLElement = new DOMParser().parseFromString(html, 'text/html').body;
  body.querySelectorAll('script, style, template').forEach((el: Element) => el.remove());
  const text: string = (body.textContent || '').replace(/\s+/g, ' ').trim();
  return text || undefined;
}
