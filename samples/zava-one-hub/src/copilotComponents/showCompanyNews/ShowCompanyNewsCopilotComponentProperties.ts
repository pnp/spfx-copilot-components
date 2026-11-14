import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  topic: z.string().optional().describe('Optional news topic such as leadership, accessibility, or customer impact.'),
  region: z.string().optional().describe('Optional Zava region or office used to filter company news.')
});

export type IShowCompanyNewsCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
