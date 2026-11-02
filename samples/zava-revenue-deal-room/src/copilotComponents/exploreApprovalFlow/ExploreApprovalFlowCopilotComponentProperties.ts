import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  period: z.enum(['current', 'next', 'all']).optional().describe("Quarter offset filter: current is 0, next is 1, all includes every seeded quarter. Defaults to current."),
  selectedId: z.string().optional().describe("Exact visible source, opportunity, or value-flow stage/connection ID to inspect. Unknown or filtered selections remain visible as no-match.")
});
export type IExploreApprovalFlowCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
