// Runtime guard for the tool arguments. The JSON schema tells the model what to send, but model
// output is untrusted: anything that doesn't fit is dropped (falls back) instead of breaking the card.

import { BCP47_PATTERN, IMAGE_KINDS, MAX_TEXT_LENGTH } from './contract';
import { isDesign, isLayout, type Design, type Layout } from './presets';

export { BCP47_PATTERN, MAX_TEXT_LENGTH };

export type ImageKind = (typeof IMAGE_KINDS)[number];

/**
 * Test builds: set to true to show the diagnostics drawer on every card, not only when the agent
 * sends debug: true. false for a release.
 */
export const ALWAYS_DEBUG: boolean = false;

export interface ICardInput {
  /** Validated BCP 47 tag, or undefined if missing/invalid (the fallback chain applies). */
  language: string | undefined;
  title: string;
  text: string;
  imageQuery: string | undefined;
  imageAlt: string | undefined;
  /** The agent's choice of image source (its analysis of the question). */
  imageSource: ImageKind | undefined;
  /** Exact English Wikipedia article title, if the agent named one. */
  wikipediaTitle: string | undefined;
  design: Design | undefined;
  layout: Layout | undefined;
  voice: string | undefined;
  debug: boolean;
}

function str(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed: string = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed;
}

export function normalizeLanguage(value: unknown): string | undefined {
  const tag: string | undefined = str(value, 35);
  if (!tag) {
    return undefined;
  }
  const dashed: string = tag.replace(/_/g, '-');
  if (!BCP47_PATTERN.test(dashed)) {
    return undefined;
  }
  try {
    // Canonical casing (de-at → de-AT) where the engine supports it.
    return Intl.getCanonicalLocales(dashed)[0] || dashed;
  } catch {
    return undefined;
  }
}

/** Keywords only: drops anything URL-like the model may have sent despite the instructions. */
export function normalizeImageQuery(value: unknown): string | undefined {
  const q: string | undefined = str(value, 100);
  if (!q) {
    return undefined;
  }
  const cleaned: string = q
    .split(/\s+/)
    .filter((word: string) => !/^(https?:|www\.)|\/\//i.test(word))
    .join(' ')
    .trim();
  return cleaned || undefined;
}

export function normalizeProps(props: unknown): ICardInput {
  const p: Record<string, unknown> = props && typeof props === 'object' ? (props as Record<string, unknown>) : {};
  return {
    language: normalizeLanguage(p.language),
    title: str(p.title, 120) || '',
    text: str(p.text, MAX_TEXT_LENGTH) || '',
    imageQuery: normalizeImageQuery(p.imageQuery),
    imageAlt: str(p.imageAlt, 200),
    imageSource: typeof p.imageSource === 'string' && (IMAGE_KINDS as readonly string[]).indexOf(p.imageSource) !== -1 ? (p.imageSource as ImageKind) : undefined,
    wikipediaTitle: normalizeImageQuery(str(p.wikipediaTitle, 200)),
    design: isDesign(p.design) ? p.design : undefined,
    layout: isLayout(p.layout) ? p.layout : undefined,
    voice: str(p.voice, 60),
    debug: ALWAYS_DEBUG || p.debug === true
  };
}
