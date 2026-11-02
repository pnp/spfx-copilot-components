import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  exceptionId: z.string().optional().describe("Exact exception ID: EX-2042 or EX-2043. Does not grant approval."),
  opportunityId: z.string().optional().describe("Exact opportunity ID: ZDR-2042. Must agree with any related record scope.")
});
export type IReviewDealExceptionCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
