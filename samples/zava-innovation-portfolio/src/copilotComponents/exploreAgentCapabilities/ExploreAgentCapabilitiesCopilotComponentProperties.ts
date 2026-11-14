import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema=z.object({
  query: z.string().optional().describe("Search terms for the capability catalog. Preview only; does not invoke another tool.")
});
export type IExploreAgentCapabilitiesCopilotComponentProperties=z.infer<typeof schema>;
export default zodToJsonSchema(schema);
