import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  category: z.string().optional().describe('Optional business capability category to show first.'),
  query: z.string().optional().describe('Optional business-language search text for capability discovery.')
});

export type IExploreAgentCapabilitiesCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
