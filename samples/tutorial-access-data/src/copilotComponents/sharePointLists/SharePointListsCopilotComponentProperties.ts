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
  siteUrl: z
    .string()
    .optional()
    .describe(
      'Absolute HTTPS URL of the SharePoint site whose lists to show, for ' +
        'example https://contoso.sharepoint.com/sites/hr. Set it only when ' +
        'the user gives a site URL. Omit it to use the current site. Never ' +
        'guess a URL from a site name.'
    )
});

export type ISharePointListsCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
