import { z } from 'zod';
// Manifest schema expansion imports the emitted module with Node ESM.
import { standardCheckIds } from './roundTrip/checks.js';

export const propertiesSchema = z.object({
  siteUrl: z.string().url().optional()
    .describe('Optional site URL suggestion only. User selects the site before loading.'),
  mode: z.enum(['comments', 'page']).optional().describe('Prefill comments or one page/news article.'),
  // The Copilot plugin schema takes string enums, so the days are strings here. The UI converts them to numbers.
  lookbackDays: z.enum(['7', '14', '30']).optional().describe('Prefill the comment lookback window in days.'),
  categoryIds: z.array(z.enum(standardCheckIds)).optional()
    .describe('Prefill review categories. No analysis runs on launch.')
});

export type IContentLensProperties = z.infer<typeof propertiesSchema>;
export default z.toJSONSchema(propertiesSchema, { target: 'draft-7' });
