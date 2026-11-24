/**
 * Tool arguments for open_step_by_step_form. Everything is optional and untrusted: values are
 * checked by the URL/list lock (https, same tenant, plain list title) before any SharePoint call.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

export const propertiesSchema = z.object({
  listName: z
    .string()
    .optional()
    .describe('Display name of the SharePoint list, only if the person typed that exact list name in this conversation. Omit if they did not name a list, including when they asked to open or show a form without naming one.'),
  siteUrl: z
    .string()
    .optional()
    .describe('Optional. Full https URL of the SharePoint site that holds the list, only if the person typed that exact URL in this conversation. Omit if they did not give a site address.'),
  fields: z
    .string()
    .optional()
    .describe('Optional. Comma-separated column names to ask, in order, only if the person asked for specific columns. Omit to ask every supported column.'),
  prefill: z
    .string()
    .optional()
    .describe('Optional. JSON object of answers the person already stated in this conversation, keyed by column name, for example {"Title":"New laptop","Category":"Hardware","Devices":["Laptop","Monitor"],"StartedAt":"2026-11-16T14:30"}. Date-only columns as YYYY-MM-DD. Date-and-time columns as ISO 8601, either the person\'s local time without a zone ("2026-11-16T14:30") or an exact instant with Z or an offset ("2026-11-16T13:30Z"). Multi-choice columns as a JSON array of option names; single choice as one option name; only the column\'s own options are accepted. Number and currency as a number (for example 12.5). Hyperlink as an https URL or {"Url":"https://example.com","Description":"Example"}; only https links are accepted. Never invent values. The person still reviews and submits.'),
  formTitle: z
    .string()
    .optional()
    .describe('Optional. Short plain-text heading for the form (max 80 characters).'),
  fieldExamples: z
    .string()
    .optional()
    .describe('Optional. JSON object of short example answers, keyed by column internal or display name, shown in the field guide, for example {"Title":"Monitor flickers"}. Never invent values from conversation here; only include examples the person asked to show. Omit if none.'),
  loadingMessage: z
    .string()
    .optional()
    .describe('Optional. Short plain-text label shown while the form loads the list. Omit to use “Loading the form…”.'),
  highlightColor: z
    .string()
    .optional()
    .describe('Optional. A hex colour such as #F2643D for the progress bar, finish tick and focus ring. Omit or leave empty for the default. Only #RGB or #RRGGBB are accepted.')
});

export type IWizardFormCopilotComponentProperties = z.infer<typeof propertiesSchema>;

const jsonSchema = zodToJsonSchema(propertiesSchema, { $refStrategy: 'none' }) as { properties?: unknown };

/** Plain object schema with no required list, no $schema and no additionalProperties (Copilot-friendly). */
export default {
  type: 'object',
  properties: jsonSchema.properties || {}
};
