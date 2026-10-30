/**
 * Tool arguments for show_weekly_quiz. Everything is optional: Copilot can call the tool with no
 * arguments and the component uses the tenant root site and the "Weekly Pulse Config" list.
 * Values are untrusted and are checked by the URL lock (same tenant, https, plain list title).
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export const propertiesSchema = z.object({
  siteUrl: z
    .string()
    .optional()
    .describe('Optional. SharePoint site that holds the Weekly Pulse Questions and Config lists. Omit to use the tenant root site.'),
  questionsListTitle: z
    .string()
    .optional()
    .describe('Optional. Title of the questions list. Omit to use "Weekly Pulse Questions".')
});

export type IWeeklyPulseQuizCopilotComponentProperties = z.infer<typeof propertiesSchema>;

const jsonSchema = zodToJsonSchema(propertiesSchema, { $refStrategy: 'none' }) as { properties?: unknown };

/** Plain object schema with no required list, no $schema and no additionalProperties (Copilot-friendly). */
export default {
  type: 'object',
  properties: jsonSchema.properties || {}
};
