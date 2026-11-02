import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  requestId: z.string().optional().describe("Exact session-only submitted deal request ID, for example ZM-1001. Unknown IDs remain unmatched; no approval is implied.")
});
export type IReviewDealApprovalCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
