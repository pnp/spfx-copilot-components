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
  view: z
    .enum(['mail', 'calendar'])
    .optional()
    .describe(
      "Which data to show below the profile. Use 'mail' when the user asks " +
        "about email, messages, or their inbox. Use 'calendar' when the user " +
        'asks about events, meetings, or their schedule. Omit it when the ' +
        'user asks only about their profile.'
    )
});

export type IMyProfileCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
