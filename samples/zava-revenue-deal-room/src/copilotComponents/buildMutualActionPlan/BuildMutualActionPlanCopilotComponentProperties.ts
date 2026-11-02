import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  opportunityId: z.string().optional().describe("Exact opportunity ID: ZDR-2042. Must agree with any related record scope.")
});
export type IBuildMutualActionPlanCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
