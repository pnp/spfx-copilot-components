/**
 * Properties schema for this Copilot Component.
 *
 * This schema is defined with Zod and exported as JSON Schema via
 * Zod's built-in converter. The manifest references the compiled `.js` default
 * export, which the Copilot host uses to validate and describe the tool
 * arguments that Copilot passes when invoking this component.
 *
 * To add more properties, extend the `z.object({...})` below — they will
 * automatically appear as tool parameters in the Copilot UI.
 */
 
import { z } from 'zod';


const propertiesSchema = z.object({
	target: z.enum(['m365_groups', 'accessed_sites', 'followed_sites']).describe('Select m365_groups for groups or membership details, accessed_sites for SharePoint sites the user can access, or followed_sites for SharePoint sites the user follows.'),
	top: z.number().int().optional().describe('The optional maximum number of items to show. Omit it to show all available results.'),
	query: z.string().trim().optional().describe('An optional site or group name, URL, ID, mail address, or description fragment used to filter the live view.'),
});

export type IMySitesGroupInfoCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default z.toJSONSchema(propertiesSchema);
