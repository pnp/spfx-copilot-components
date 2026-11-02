import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const schema = z.object({
  accountId: z.string().optional().describe("Exact account record ID, for example CONTOSO or ACC-002. Unknown IDs show no-match."),
  opportunityId: z.string().optional().describe("Exact opportunity ID, for example ZDR-2042. Must agree with any related record scope."),
  quantity: z.number().optional().describe("Whole licensed-user count, 1 to 100000. Defaults to 860; validated at runtime."),
  termMonths: z.number().optional().describe("Whole contract months, 1 to 120. Defaults to 36; recurring delivery cost scales with term."),
  discount: z.number().optional().describe("Discount percentage, 0 to 100. Defaults to 14. Authority requirements are not approvals."),
  services: z.number().optional().describe("One-time services revenue in USD, 0 to 100000000. Defaults to 420000."),
  probability: z.number().optional().describe("Scenario win probability, 0 to 1 (not a percentage). Defaults to 0.72. Weights contract value.")
});
export type ISubmitDealRequestCopilotComponentProperties = z.infer<typeof schema>;
export default zodToJsonSchema(schema);
