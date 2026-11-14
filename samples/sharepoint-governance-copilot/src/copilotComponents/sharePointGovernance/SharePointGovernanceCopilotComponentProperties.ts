/**
 * Properties schema for this Copilot Component.
 *
 * This schema is defined with Zod and exported as JSON Schema via
 * `zod-to-json-schema`. The manifest references the compiled `.js` default
 * export, which the Copilot host uses to validate and describe the tool
 * arguments that Copilot passes when invoking this component.
 *
 * To add more properties, extend the `z.object({...})` below — they will
 * automatically appear as tool parameters in the Copilot UI.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  message: z.string().describe('A message to display.'),
  riskType: z
    .enum(['all', 'missingOwner', 'inactive', 'broadSharing', 'expiring'])
    .optional()
    .describe('Filter risks by type. Defaults to all risk types.'),
  minimumSeverity: z
    .enum(['low', 'medium', 'high'])
    .optional()
    .describe('Only include risks at or above this severity. Defaults to low.'),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Maximum number of risks to return (1-50). Defaults to 20.')
});

export type ISharePointGovernanceCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
