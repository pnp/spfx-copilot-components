import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  siteUrl: z
    .string()
    .describe(
      'The absolute HTTPS URL of the SharePoint site whose lists to show, ' +
        'for example https://contoso.sharepoint.com/sites/hr. Use the URL ' +
        'the user gives. Pass the site URL only, without a page or list ' +
        'path. Never guess a URL.'
    )
});

export type IMyCopilotAppCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
