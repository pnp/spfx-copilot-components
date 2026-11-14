// Constants shared by the tool contract (CosmoPoliteCopilotComponentProperties.ts, build time only)
// and the runtime guard (lib/normalize.ts, lib/presets.ts). This file has no imports on purpose:
// the manifest macro loads the compiled contract as native ESM, where only explicit, self-contained
// modules resolve. Everything that both sides must agree on lives here, once.

/** Design presets; the values are [data-design="…"] blocks in src/ui/tokens/Presets.module.scss. */
export const DESIGNS = ['editorial', 'classic', 'dramatic', 'compact', 'magazine'] as const;

/** News layouts: where the photo sits relative to headline and text. */
export const LAYOUTS = ['lead', 'teaser', 'beside'] as const;

/**
 * Where the agent thinks the best picture is, after analysing the question:
 * wikipedia: a specific person, place, building, event or organisation with its own article;
 * museum: an artwork or art-historical topic; space: astronomy and spaceflight;
 * photo: scenes, moods, food, everyday life, abstract topics.
 */
export const IMAGE_KINDS = ['wikipedia', 'museum', 'space', 'photo'] as const;

/** BCP 47-ish: a 2-3 letter primary subtag plus optional script/region/variant subtags. */
export const BCP47_PATTERN: RegExp = /^[a-zA-Z]{2,3}(-[a-zA-Z0-9]{2,8})*$/;

export const MAX_TEXT_LENGTH: number = 1200;
