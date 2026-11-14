import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  outcome: z.string().optional().describe("Specific business outcome, sourcing scope, mitigation action, or negotiation objective stated by the user."),
  quantity: z.number().int().optional().describe("Whole positive unit quantity explicitly requested by the user; runtime range is 1 to 100000."),
  budget: z.number().optional().describe("Budget, negotiation target, mitigation cost, or PO change cap. Runtime policy validates it; a prompt never grants authority."),
  currency: z.enum(['EUR','USD','GBP','JPY']).optional().describe("Explicit currency; comparison and policy scenarios use EUR and never silently convert."),
  neededBy: z.string().optional().describe("ISO date YYYY-MM-DD for delivery, bid deadline, mitigation, negotiation, or qualification expiry."),
  locations: z.array(z.string()).optional().describe("Named delivery locations for the editable purchase draft."),
  constraints: z.array(z.string()).optional().describe("User-stated purchase constraints to retain in the reviewed outcome and policy context."),
  categoryHint: z.string().optional().describe("Requested category for a new purchase, such as IT hardware.")
});
export type ICreatePurchaseIntentCopilotComponentProperties = z.infer<typeof propertiesSchema>;
export default zodToJsonSchema(propertiesSchema);
