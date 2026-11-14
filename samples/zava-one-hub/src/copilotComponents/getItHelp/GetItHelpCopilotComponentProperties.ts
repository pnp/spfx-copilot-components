import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  category: z.enum(['Access', 'Device', 'Network', 'Software', 'Other']).optional().describe('Optional IT issue category.'),
  impact: z.enum(['Low', 'Medium', 'High']).optional().describe('Optional user impact.'),
  summary: z.string().optional().describe('Optional editable issue summary.'),
  description: z.string().optional().describe('Optional editable issue description.')
});

export type IGetItHelpCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
