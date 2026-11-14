import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  opportunityId: z.string().optional().describe("Exact opportunity ID: ZDR-2042. Must agree with any related record scope."),
  proposalId: z.string().optional().describe("Exact proposal ID: PROP-2042 or PROP-2043. Does not grant readiness.")
});
export type IShapeSolutionProposalCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
