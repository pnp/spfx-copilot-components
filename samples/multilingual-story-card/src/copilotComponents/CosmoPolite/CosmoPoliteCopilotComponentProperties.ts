import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

// The tool contract. Every .describe() text is an instruction to the model, so it is written for it.
// zod is only used at build time to produce the JSON schema; the component imports the type only and
// re-checks the values at runtime in lib/normalize.ts, which keeps zod out of the bundle.
//
// The manifest macro loads the compiled file as native ESM, where extension-less relative imports
// don't resolve. Hence the explicit ".js": TypeScript maps it to lib/contract.ts, the compiled
// lib/ folder has the real lib/contract.js, and the runtime guard imports the same constants.
import { BCP47_PATTERN, DESIGNS, IMAGE_KINDS, LAYOUTS, MAX_TEXT_LENGTH } from './lib/contract.js';

const propertiesSchema = z.object({
  language: z
    .string()
    .regex(BCP47_PATTERN)
    .describe(
      "BCP 47 language tag of the user's latest message, e.g. 'de', 'en-US', 'fi', 'sv', 'ar', 'ja'. " +
        'Detect it from the message text itself, even if it is only JSON or differs from earlier turns. ' +
        "Austrian German or Viennese dialect is 'de-AT'."
    ),
  title: z.string().max(120).describe('Short headline of the card. MUST be written in the language given in "language" (never in English unless "language" is English).'),
  text: z
    .string()
    .max(MAX_TEXT_LENGTH)
    .describe('80 to 120 words about the topic. MUST be written in the language given in "language" (never in English unless "language" is English). Keep the dialect if the user wrote in one. Plain text, no Markdown or links.'),
  imageQuery: z
    .string()
    .max(100)
    .describe('Always required: 2 to 4 English keywords to find a fitting picture, e.g. "Vienna St. Stephen Cathedral". Never a URL.'),
  imageSource: z
    .enum(IMAGE_KINDS)
    .optional()
    .describe(
      'Analyse the question and pick where the best picture is: ' +
        '"wikipedia" for a specific person, place, building, event or organisation that has its own Wikipedia article (also set wikipediaTitle); ' +
        '"museum" for a painting, sculpture or other artwork, or an art-historical topic; ' +
        '"space" for planets, stars, galaxies, space missions and astronauts; ' +
        '"photo" for general scenes, moods, food, everyday life and abstract topics.'
    ),
  wikipediaTitle: z
    .string()
    .max(200)
    .optional()
    .describe('The exact title of the English Wikipedia article about the subject, e.g. "Egon Schiele" or "St. Stephen\'s Cathedral, Vienna". Only when such an article exists.'),
  imageAlt: z.string().max(200).optional().describe('Short description of such a photo. MUST be written in the language given in "language" (never in English unless "language" is English).'),
  design: z
    .enum(DESIGNS)
    .optional()
    .describe('Only if the user asks for a look: editorial, classic, dramatic, compact or magazine.'),
  layout: z
    .enum(LAYOUTS)
    .optional()
    .describe('Only if the user asks where the photo should go: lead (big photo on top), teaser (small photo beside the headline) or beside (text wraps around the photo).'),
  voice: z.string().max(60).optional().describe("Only if the user asks for a voice: 'female' or 'male'."),
  debug: z.boolean().optional().describe('Only if the user asks for diagnostics: true.')
});

export type ICosmoPoliteCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
