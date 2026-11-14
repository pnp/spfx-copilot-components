import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  query: z.string().optional().describe("Business terms to search the capability explorer.")
});
export type IExploreAgentCapabilitiesCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
