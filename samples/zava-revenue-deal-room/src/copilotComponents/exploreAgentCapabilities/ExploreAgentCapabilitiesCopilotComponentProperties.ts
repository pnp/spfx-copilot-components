import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  query: z.string().optional().describe("Search capability titles and outcomes; selecting a preview never executes a tool.")
});
export type IExploreAgentCapabilitiesCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
