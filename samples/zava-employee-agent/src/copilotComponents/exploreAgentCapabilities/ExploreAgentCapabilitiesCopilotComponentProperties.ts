import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  query: z.string().optional().describe('Business terms used to search available employee-agent scenarios, not private HR record content.'),
  category: z.enum(['home', 'time', 'money', 'benefits', 'rewards', 'policy', 'support', 'learning', 'team', 'people']).optional()
    .describe('Optional employee capability family to browse. Omit to show all available features.')
});
export type IExploreAgentCapabilitiesCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
