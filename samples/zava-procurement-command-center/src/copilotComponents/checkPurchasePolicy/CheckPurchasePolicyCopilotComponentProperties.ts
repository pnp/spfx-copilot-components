import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  requestId: z.string().optional().describe("Existing purchase request identifier. Unknown identifiers remain visible as no-match states."),
  quantity: z.number().int().optional().describe("Whole positive unit quantity explicitly requested by the user; runtime range is 1 to 100000."),
  budget: z.number().optional().describe("Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority."),
  currency: z.enum(['EUR','USD','GBP','JPY']).optional().describe("Explicit currency; comparison and policy scenarios use EUR and never silently convert."),
  constraints: z.array(z.string()).optional().describe("User-stated purchase constraints to retain in the reviewed outcome and policy context.")
});
export type ICheckPurchasePolicyCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
