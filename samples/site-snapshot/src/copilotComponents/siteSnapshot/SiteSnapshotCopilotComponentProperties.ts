/**
 * Tool parameter schema for the Site Snapshot component.
 *
 * Defined with Zod and exported as JSON Schema via `zod-to-json-schema`. The
 * manifest points at the compiled `.js` default export, which the Copilot host
 * uses to validate and describe the arguments Copilot passes to the tool.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  siteUrl: z
    .string()
    .optional()
    .describe('Absolute URL or name of the SharePoint site to analyse, taken from the user prompt, e.g. "https://contoso.sharepoint.com/sites/Marketing" or "Marketing".'),
  staleMonths: z
    .number()
    .int()
    .optional()
    .describe('A file counts as old if it has not changed within this many months (default 6).'),
  largeMb: z
    .number()
    .int()
    .optional()
    .describe('A file counts as large if it is at least this many megabytes (default 100).'),
  // Lets the chat open the dashboard straight to the view the user asked about,
  // e.g. "which files are shared outside?" opens the sharing view.
  focus: z
    .enum(['overview', 'types', 'owners', 'duplicates', 'stale', 'external', 'empty', 'largest'])
    .optional()
    .describe(
      'Which detail view to open first. Use "external" for sharing questions, "duplicates" for duplicate files, "stale" for old files, "largest" for big files, "empty" for empty files, "types" for a file-type breakdown, "owners" for who created what. Omit for the default view.'
    )
});

export type ISiteSnapshotCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
